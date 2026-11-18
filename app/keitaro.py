from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

import httpx

from app.config import get_settings


class KeitaroError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class KeitaroClient:
    def __init__(self):
        settings = get_settings()
        self.host = settings.keitaro_host
        self.api_key = settings.keitaro_api_key
        if not self.host or not self.api_key:
            raise KeitaroError("Заполните KEITARO_HOST и KEITARO_API в .env", 503)
        self.base_url = self.host + "/admin_api/v1/"

    async def request(self, method: str, path: str, *, params=None, json=None) -> Any:
        url = urljoin(self.base_url, path.lstrip("/"))
        headers = {"Api-Key": self.api_key, "Accept": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(30.0), follow_redirects=False) as client:
                response = await client.request(method, url, headers=headers, params=params, json=json)
        except httpx.TimeoutException as exc:
            raise KeitaroError("Keitaro не ответил за 30 секунд") from exc
        except httpx.HTTPError as exc:
            raise KeitaroError("Не удалось соединиться с Keitaro") from exc

        if response.status_code >= 400:
            try:
                body = response.json()
                detail = body.get("message") or body.get("error") or body
            except ValueError:
                detail = response.text[:500]
            raise KeitaroError(f"Keitaro вернул {response.status_code}: {detail}", response.status_code)
        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return response.text

    async def list(self, path: str, *, params: dict | None = None) -> list[dict]:
        data = await self.request("GET", path, params=params)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("data", "items", "results"):
                if isinstance(data.get(key), list):
                    return data[key]
        return []

    async def create_campaign(self, payload: dict) -> dict:
        return await self.request("POST", "campaigns", json=payload)

    async def get_streams(self, campaign_id: int) -> list[dict]:
        return await self.list(f"campaigns/{campaign_id}/streams")

    async def get_stream(self, stream_id: int) -> dict:
        data = await self.request("GET", f"streams/{stream_id}")
        return data if isinstance(data, dict) else {}

    async def create_stream(self, payload: dict) -> dict:
        return await self.request("POST", "streams", json=payload)

    async def update_stream_offers(self, stream_id: int, offers: list[dict]) -> dict:
        return await self.request("PUT", f"streams/{stream_id}", json={"offers": offers})

    async def get_offer(self, offer_id: int) -> dict:
        data = await self.request("GET", f"offers/{offer_id}")
        return data if isinstance(data, dict) else {}

    async def restore_offer(self, offer_id: int) -> None:
        await self.request("POST", f"offers/{offer_id}/restore")
