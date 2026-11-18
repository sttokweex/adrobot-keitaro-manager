from pathlib import Path
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import get_settings

class Base(DeclarativeBase):
    pass

_path = Path(get_settings().sqlite_path).expanduser().resolve()
_path.parent.mkdir(parents=True, exist_ok=True)
database_url = URL.create("sqlite", database=str(_path))
engine = create_engine(database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
