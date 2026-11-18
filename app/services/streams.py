import asyncio
from collections import defaultdict

from fastapi import HTTPException

from app.repositories import offer_archive as storage
from app.keitaro import KeitaroClient, KeitaroError
from app.services.catalog import offer_name_map
from app.schemas import AddOfferInput, ShareInput


def rebalance(campaign_id: int, stream_id: int):
    rows = [
        row for row in storage.rows_for_campaign(campaign_id)
        if row["stream_id"] == stream_id and row["status"] not in ("pending_remove", "removed")
    ]
    if not rows:
        return
    pinned = [row for row in rows if row["pinned"]]
    unpinned = [row for row in rows if not row["pinned"]]
    pinned_total = sum(int(row["current_share"]) for row in pinned)
    if pinned_total > 100:
        raise HTTPException(409, "Сумма закреплённых весов превышает 100%")
    if not unpinned:
        if pinned_total != 100:
            raise HTTPException(409, "Нельзя распределить остаток: закрепите веса так, чтобы сумма была 100%")
        return
    base, extra = divmod(100 - pinned_total, len(unpinned))
    unpinned.sort(key=lambda row: row["offer_id"])
    for index, row in enumerate(unpinned):
        share = base + (1 if index < extra else 0)
        row["current_share"] = share
        if row["status"] not in ("pending_add", "pending_remove"):
            row["status"] = "active" if row["remote_share"] == share else "modified"
        storage.put_offer(row)


def campaign_view(campaign_id: int, remote_streams: list[dict]):
    by_stream = defaultdict(list)
    for record in storage.rows_for_campaign(campaign_id):
        by_stream[record["stream_id"]].append(record)
    remote_by_id = {int(stream.get("id") or 0): stream for stream in remote_streams if stream.get("id") is not None}
    result = []
    for stream_id in sorted(set(remote_by_id) | set(by_stream)):
        stream = remote_by_id.get(stream_id, {})
        offers = by_stream.get(stream_id, [])
        result.append({
            "id": stream_id,
            "name": stream.get("name") or f"Поток {stream_id}",
            "type": stream.get("type") or "regular",
            "remote": bool(stream),
            "changed": any(offer["status"] in ("pending_add", "pending_remove", "modified") for offer in offers),
            "offers": offers,
        })
    return result


async def fetch_streams(client: KeitaroClient, campaign_id: int):
    remote_streams, remote_offers = await asyncio.gather(client.get_streams(campaign_id), client.list("offers"))
    storage.sync_campaign(campaign_id, remote_streams, offer_name_map(remote_offers))
    return {"campaign_id": campaign_id, "streams": campaign_view(campaign_id, remote_streams)}


async def add_offer(client: KeitaroClient, campaign_id: int, stream_id: int, payload: AddOfferInput):
    offer = await client.get_offer(payload.offer_id)
    existing = storage.get_offer(campaign_id, stream_id, payload.offer_id)
    if existing and existing["status"] not in ("removed",):
        raise HTTPException(409, "Этот оффер уже есть в потоке или ожидает сохранения")
    row = existing or {
        "campaign_id": campaign_id, "stream_id": stream_id, "offer_id": payload.offer_id,
        "name": str(offer.get("name") or payload.offer_id), "current_share": 0,
        "remote_share": None, "status": "pending_add", "pinned": 0,
    }
    row.update({"name": str(offer.get("name") or row["name"]), "status": "pending_add"})
    if existing:
        row["remote_share"] = 0
        row["current_share"] = 0
    storage.put_offer(row)
    rebalance(campaign_id, stream_id)
    return {"ok": True}


def remove_offer(campaign_id: int, stream_id: int, offer_id: int):
    row = storage.get_offer(campaign_id, stream_id, offer_id)
    if not row or row["status"] == "removed":
        raise HTTPException(404, "Оффер не найден")
    row["status"] = "pending_remove"
    storage.put_offer(row)
    rebalance(campaign_id, stream_id)
    return {"ok": True}


def bring_back(campaign_id: int, stream_id: int, offer_id: int):
    row = storage.get_offer(campaign_id, stream_id, offer_id)
    if not row:
        raise HTTPException(404, "Архивная запись не найдена")
    if row["status"] != "removed":
        raise HTTPException(409, "Оффер не находится в архиве")
    row.update({"status": "pending_add", "remote_share": 0, "current_share": 0})
    storage.put_offer(row)
    rebalance(campaign_id, stream_id)
    return {"ok": True}


def toggle_pin(campaign_id: int, stream_id: int, offer_id: int):
    row = storage.get_offer(campaign_id, stream_id, offer_id)
    if not row or row["status"] in ("removed", "pending_remove"):
        raise HTTPException(404, "Оффер нельзя закрепить в текущем статусе")
    row["pinned"] = 0 if row["pinned"] else 1
    storage.put_offer(row)
    rebalance(campaign_id, stream_id)
    return {"ok": True}


def update_share(campaign_id: int, stream_id: int, offer_id: int, payload: ShareInput):
    row = storage.get_offer(campaign_id, stream_id, offer_id)
    if not row or row["status"] in ("removed", "pending_remove"):
        raise HTTPException(404, "Оффер нельзя изменить в текущем статусе")
    row["current_share"] = payload.share
    if row["status"] != "pending_add":
        row["status"] = "active" if row["remote_share"] == payload.share else "modified"
    storage.put_offer(row)
    return {"ok": True}


async def save_stream(client: KeitaroClient, campaign_id: int, stream_id: int):
    rows = [row for row in storage.rows_for_campaign(campaign_id) if row["stream_id"] == stream_id]
    if not rows:
        raise HTTPException(404, "В потоке нет офферов для сохранения")
    active = [row for row in rows if row["status"] not in ("removed", "pending_remove")]
    if active and sum(int(row["current_share"]) for row in active) != 100:
        raise HTTPException(409, "Сумма весов активных офферов должна быть 100%")
    offers_payload = []
    for row in active:
        try:
            offer = await client.get_offer(row["offer_id"])
        except KeitaroError as exc:
            if exc.status_code != 404:
                raise
            await client.restore_offer(row["offer_id"])
            offer = await client.get_offer(row["offer_id"])
        if str(offer.get("state", "active")).lower() == "deleted":
            await client.restore_offer(row["offer_id"])
        offers_payload.append({"offer_id": row["offer_id"], "share": int(row["current_share"]), "state": "active"})
    await client.update_stream_offers(stream_id, offers_payload)
    storage.finish_save(campaign_id, stream_id)
    return {"ok": True}


def cancel_stream(campaign_id: int, stream_id: int):
    storage.cancel_drafts(campaign_id, stream_id)
    return {"ok": True}
