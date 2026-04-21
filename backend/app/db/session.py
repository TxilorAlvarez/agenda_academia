from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
engine_kwargs = {
    "echo": settings.DEBUG,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL con connection pooler
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 3
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["pool_recycle"] = 300
    # Desactivar prepared statements para modo Transaction pooler
    connect_args = {"options": "-c statement_timeout=30000"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
