from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

from app.models import (
    Instructor, Student, Vehicle,
    Booking, InstructorAvailability,
)

from app.api.v1.routes_instructors import router as instructors_router
from app.api.v1.routes_students import router as students_router
from app.api.v1.routes_vehicles import router as vehicles_router
from app.api.v1.routes_bookings import router as bookings_router
from app.api.v1.routes_availability import router as availability_router
from app.api.v1.routes_health import router as health_router
from app.api.v1.routes_import import router as import_router
from app.api.v1.routes_export import router as export_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema de agendamiento de practicas de conduccion",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(instructors_router, prefix="/api/v1")
app.include_router(students_router, prefix="/api/v1")
app.include_router(vehicles_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(availability_router, prefix="/api/v1")
app.include_router(import_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.APP_NAME, "version": "0.4.0"}


HOURS_CONFIG = {
    "moto": {"practice": 14, "exam": 1, "total": 15, "block": "2h practice + 1h exam"},
    "carro_b1": {"practice": 19, "exam": 1, "total": 20, "block": "2h practice + 1h exam"},
    "carro_c1": {"practice": 29, "exam": 1, "total": 30, "block": "2h practice + 1h exam"},
}


@app.get("/config/hours")
def get_hours_config():
    return HOURS_CONFIG
