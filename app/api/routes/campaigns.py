from fastapi import APIRouter, Depends

from app.dependencies import get_keitaro_client
from app.keitaro import KeitaroClient
from app.schemas import CampaignInput
from app.services import catalog, streams

router = APIRouter()


@router.get("/api/campaigns")
async def list_campaigns(client: KeitaroClient = Depends(get_keitaro_client)):
    return await catalog.list_campaigns(client)


@router.get("/api/resources")
async def list_resources(client: KeitaroClient = Depends(get_keitaro_client)):
    return await catalog.list_resources(client)


@router.get("/api/campaigns/{campaign_id}/streams")
async def fetch_streams(campaign_id: int, client: KeitaroClient = Depends(get_keitaro_client)):
    return await streams.fetch_streams(client, campaign_id)


@router.post("/api/campaigns")
async def create_campaign(payload: CampaignInput, client: KeitaroClient = Depends(get_keitaro_client)):
    return await catalog.create_campaign(client, payload)
