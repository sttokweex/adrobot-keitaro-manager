from fastapi import HTTPException

from app.keitaro import KeitaroClient, KeitaroError


def get_keitaro_client() -> KeitaroClient:
    try:
        return KeitaroClient()
    except KeitaroError as exc:
        raise HTTPException(exc.status_code, exc.message) from exc
