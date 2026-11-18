import asyncio
import re
import time

from fastapi import HTTPException

from app.keitaro import KeitaroClient, KeitaroError
from app.schemas import CampaignInput

ACTION_CACHE_TTL_SECONDS = 3600
_redirect_action_cache: tuple[str, float] | None = None
_redirect_action_lock = asyncio.Lock()


def items(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("data", "items", "results"):
            if isinstance(data.get(key), list):
                return data[key]
    return []


def clean_resources(data):
    result = []
    for row in items(data):
        if not isinstance(row, dict):
            continue
        value = row.get("id")
        name = row.get("name") or row.get("title") or str(value or "")
        if value is not None:
            result.append({"id": value, "name": str(name)})
    return result


def offer_name_map(offers):
    return {
        int(offer["id"]): str(offer.get("name") or offer["id"])
        for offer in offers
        if isinstance(offer, dict) and offer.get("id") is not None
    }


def normalized_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:50].strip("-") or "adrobot-campaign"


async def list_campaigns(client: KeitaroClient):
    rows = await client.list("campaigns")
    result = []
    for row in rows:
        if isinstance(row, dict) and row.get("id") is not None:
            result.append({"id": int(row["id"]), "name": str(row.get("name") or f"Кампания {row['id']}")})
    return sorted(result, key=lambda campaign: campaign["name"].casefold())


async def list_resources(client: KeitaroClient):
    domains, groups, sources = await asyncio.gather(
        client.list("domains"),
        client.list("groups", params={"type": "campaigns"}),
        client.list("traffic_sources"),
    )
    return {
        "domains": clean_resources(domains),
        "groups": clean_resources(groups),
        "traffic_sources": clean_resources(sources),
    }


async def search_offers(client: KeitaroClient, query: str):
    data = await client.list("offers")
    needle = query.strip().casefold()
    result = []
    for offer in data:
        if not isinstance(offer, dict) or offer.get("id") is None:
            continue
        name = str(offer.get("name") or "")
        if needle and needle not in name.casefold() and needle not in str(offer["id"]):
            continue
        result.append({"id": int(offer["id"]), "name": name})
    return result[:100]


async def get_redirect_action(client: KeitaroClient) -> str:
    global _redirect_action_cache
    now = time.monotonic()
    if _redirect_action_cache and _redirect_action_cache[1] > now:
        return _redirect_action_cache[0]
    async with _redirect_action_lock:
        now = time.monotonic()
        if _redirect_action_cache and _redirect_action_cache[1] > now:
            return _redirect_action_cache[0]
        actions = await client.list("streams_actions")
        action = next(
            (
                str(row.get("key"))
                for row in actions
                if isinstance(row, dict)
                and str(row.get("type", "")).casefold() == "redirect"
                and str(row.get("field", "")).casefold() == "url"
                and row.get("key")
            ),
            None,
        )
        if not action:
            raise KeitaroError("Keitaro не вернул допустимое действие перенаправления (streams_actions)", 502)
        _redirect_action_cache = (action, now + ACTION_CACHE_TTL_SECONDS)
        return action


async def warm_action_cache():
    try:
        await get_redirect_action(KeitaroClient())
    except Exception:
        # The first campaign creation retries when Keitaro is temporarily unavailable.
        return


async def create_campaign(client: KeitaroClient, payload: CampaignInput):
    country = payload.country.strip().upper()
    if not re.fullmatch(r"[A-Z]{2}", country):
        raise HTTPException(422, "GEO должен быть двухбуквенным кодом страны, например AU")
    redirect_action = await get_redirect_action(client)
    body = {
        "name": payload.name.strip(),
        "alias": normalized_slug(payload.name),
        "group_id": payload.group_id,
        "traffic_source_id": payload.traffic_source_id,
        "domain_id": payload.domain_id,
        "type": "position",
        "state": "active",
    }
    campaign = await client.create_campaign(body)
    campaign_id = int(campaign.get("id") or 0)
    if not campaign_id:
        raise HTTPException(502, "Keitaro не вернул ID созданной кампании")
    try:
        await client.create_stream({
            "campaign_id": campaign_id,
            "type": "regular",
            "name": f"Google — {country}",
            "position": 1,
            "state": "active",
            "schema": "redirect",
            "action_type": redirect_action,
            "action_payload": "https://www.google.com",
            "collect_clicks": True,
            "filters": [{"name": "country", "mode": "accept", "payload": [country]}],
        })
    except KeitaroError as exc:
        raise HTTPException(502, f"Кампания {campaign_id} создана, но Google-поток не создан: {exc.message}") from exc
    try:
        await client.create_stream({
            "campaign_id": campaign_id,
            "type": "default",
            "name": "Offer",
            "position": 2,
            "state": "active",
            "schema": "landings",
            "action_type": redirect_action,
            "collect_clicks": True,
            "offers": [{"offer_id": payload.offer_id, "share": 100, "state": "active"}],
        })
    except KeitaroError as exc:
        raise HTTPException(502, f"Кампания {campaign_id} создана, Google-поток есть, но Offer-поток не создан: {exc.message}") from exc
    return {"ok": True, "campaign_id": campaign_id, "campaign_name": campaign.get("name") or payload.name}
