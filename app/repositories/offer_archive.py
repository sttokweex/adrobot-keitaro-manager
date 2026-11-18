from contextlib import contextmanager
from datetime import datetime, timezone
from sqlalchemy import select
from app.database import SessionLocal
from app.models import OfferArchive

def _now(): return datetime.now(timezone.utc).isoformat()
@contextmanager
def _session():
    session=SessionLocal()
    try:
        yield session; session.commit()
    except Exception:
        session.rollback(); raise
    finally: session.close()
def _dict(row): return {c.name:getattr(row,c.name) for c in OfferArchive.__table__.columns} if row else None
def sync_campaign(campaign_id, streams, offer_names):
    remote={}
    for stream in streams:
        sid=int(stream.get("id") or 0)
        for offer in stream.get("offers") or []:
            oid=int(offer.get("offer_id") or offer.get("id") or 0)
            if sid and oid: remote[(sid,oid)]={"name":offer_names.get(oid) or str(oid),"share":int(offer.get("share") or 0)}
    with _session() as db:
        rows=db.scalars(select(OfferArchive).where(OfferArchive.campaign_id==campaign_id)).all(); old={(r.stream_id,r.offer_id):r for r in rows}
        for (sid,oid),v in remote.items():
            row=old.get((sid,oid))
            if row is None:
                db.add(OfferArchive(campaign_id=campaign_id,stream_id=sid,offer_id=oid,name=v["name"],current_share=v["share"],remote_share=v["share"],status="active",pinned=0,updated_at=_now())); continue
            if row.status=="pending_remove": share,status=row.current_share,"pending_remove"
            elif row.status=="pending_add": share,status=v["share"],"active"
            elif row.status=="modified": share,status=row.current_share,"modified"
            else: share,status=v["share"],"active"
            row.name,row.current_share,row.remote_share,row.status,row.updated_at=v["name"],share,v["share"],status,_now()
        for key,row in old.items():
            if key in remote or row.status == "pending_add":
                continue
            row.current_share=row.remote_share=0; row.status="removed"; row.updated_at=_now()
def rows_for_campaign(cid):
    with SessionLocal() as db:
        rows=db.scalars(select(OfferArchive).where(OfferArchive.campaign_id==cid).order_by(OfferArchive.stream_id,OfferArchive.offer_id)).all(); return [_dict(r) for r in rows]
def get_offer(cid,sid,oid):
    with SessionLocal() as db: return _dict(db.get(OfferArchive,(cid,sid,oid)))
def put_offer(row):
    with _session() as db:
        key=(row["campaign_id"],row["stream_id"],row["offer_id"]); obj=db.get(OfferArchive,key)
        if obj is None:
            obj=OfferArchive(**{k:row.get(k) for k in ("campaign_id","stream_id","offer_id","name","current_share","remote_share","status","pinned")},updated_at=_now()); db.add(obj)
        else:
            for k in ("name","current_share","remote_share","status","pinned"): setattr(obj,k,row.get(k))
            obj.updated_at=_now()
def delete_new_offer(cid,sid,oid):
    with _session() as db:
        row=db.get(OfferArchive,(cid,sid,oid))
        if row is not None and row.remote_share is None: db.delete(row)
def cancel_drafts(cid,sid):
    with _session() as db:
        rows=db.scalars(select(OfferArchive).where(OfferArchive.campaign_id==cid,OfferArchive.stream_id==sid)).all()
        for r in rows:
            if r.status=="pending_add":
                if r.remote_share is None: db.delete(r)
                else: r.status,r.current_share,r.updated_at="removed",0,_now()
            elif r.status in ("pending_remove","modified"): r.status,r.current_share,r.updated_at="active",r.remote_share or 0,_now()
def finish_save(cid,sid):
    with _session() as db:
        rows=db.scalars(select(OfferArchive).where(OfferArchive.campaign_id==cid,OfferArchive.stream_id==sid)).all()
        for r in rows:
            if r.status in ("pending_add","modified"): r.remote_share,r.status,r.updated_at=r.current_share,"active",_now()
            elif r.status=="pending_remove": r.current_share=r.remote_share=0; r.status="removed"; r.updated_at=_now()
def set_removed_share(cid,sid,oid):
    with _session() as db:
        r=db.get(OfferArchive,(cid,sid,oid))
        if r is not None: r.status="removed"; r.current_share=r.remote_share=0; r.updated_at=_now()
