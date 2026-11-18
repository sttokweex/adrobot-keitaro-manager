import os
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    keitaro_host: str
    keitaro_api_key: str
    sqlite_path: str


def get_settings() -> Settings:
    raw_host = os.getenv("KEITARO_HOST", "").strip()
    api_key = os.getenv("KEITARO_API", "").strip()
    if raw_host and not raw_host.startswith(("http://", "https://")):
        raw_host = "https://" + raw_host
    if raw_host:
        parts = urlsplit(raw_host)
        path = parts.path.rstrip("/")
        for suffix in ("/admin_api/v1", "/admin"):
            if path.endswith(suffix):
                path = path[:-len(suffix)].rstrip("/")
        raw_host = urlunsplit((parts.scheme, parts.netloc, path, "", "")).rstrip("/")
    return Settings(
        keitaro_host=raw_host,
        keitaro_api_key=api_key,
        sqlite_path=os.getenv("SQLITE_PATH", "data/adrobot.sqlite3"),
    )
