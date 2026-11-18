import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import campaigns, offers
from app.keitaro import KeitaroError
from app.services.catalog import warm_action_cache

BASE = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(warm_action_cache())
    yield


app = FastAPI(title="AdRobot Keitaro Manager", version="1.0.0", lifespan=lifespan)
app.include_router(campaigns.router)
app.include_router(offers.router)

FRONTEND_DIST = BASE.parent / "frontend" / "dist"
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.exception_handler(KeitaroError)
async def keitaro_error_handler(request: Request, exc: KeitaroError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/", response_class=HTMLResponse)
async def index():
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.is_file():
        return HTMLResponse("React frontend is not built. Run docker compose up --build.", status_code=503)
    return FileResponse(index_file)


@app.get("/api/health")
async def health():
    from app.config import get_settings

    settings = get_settings()
    return {"ok": True, "keitaro_configured": bool(settings.keitaro_host and settings.keitaro_api_key)}
