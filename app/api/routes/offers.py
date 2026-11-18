from fastapi import APIRouter, Depends

from app.dependencies import get_keitaro_client
from app.keitaro import KeitaroClient
from app.schemas import AddOfferInput, ShareInput
from app.services import catalog, streams

router = APIRouter()


@router.get("/api/offers")
async def search_offers(q: str = "", client: KeitaroClient = Depends(get_keitaro_client)):
    return await catalog.search_offers(client, q)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/offers")
async def add_offer(campaign_id: int, stream_id: int, payload: AddOfferInput, client: KeitaroClient = Depends(get_keitaro_client)):
    return await streams.add_offer(client, campaign_id, stream_id, payload)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/offers/{offer_id}/remove")
async def remove_offer(campaign_id: int, stream_id: int, offer_id: int):
    return streams.remove_offer(campaign_id, stream_id, offer_id)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/offers/{offer_id}/bring-back")
async def bring_back(campaign_id: int, stream_id: int, offer_id: int):
    return streams.bring_back(campaign_id, stream_id, offer_id)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/offers/{offer_id}/pin")
async def toggle_pin(campaign_id: int, stream_id: int, offer_id: int):
    return streams.toggle_pin(campaign_id, stream_id, offer_id)


@router.patch("/api/campaigns/{campaign_id}/streams/{stream_id}/offers/{offer_id}")
async def update_share(campaign_id: int, stream_id: int, offer_id: int, payload: ShareInput):
    return streams.update_share(campaign_id, stream_id, offer_id, payload)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/save")
async def save_stream(campaign_id: int, stream_id: int, client: KeitaroClient = Depends(get_keitaro_client)):
    return await streams.save_stream(client, campaign_id, stream_id)


@router.post("/api/campaigns/{campaign_id}/streams/{stream_id}/cancel")
async def cancel_stream(campaign_id: int, stream_id: int):
    return streams.cancel_stream(campaign_id, stream_id)
