from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.instructor import VehicleType
import enum


class StudentStatus(str, enum.Enum):
    ACTIVO = "activo"
    COMPLETADO = "completado"
    RETIRADO = "retirado"
    PENDIENTE = "pendiente"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    document = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    category = Column(SAEnum(VehicleType), nullable=False)  # moto, b1, c1

    # Horas totales requeridas segun categoria
    total_hours_required = Column(Integer, nullable=False)
    # Horas ya completadas
    hours_completed = Column(Integer, default=0)
    # Estado
    status = Column(SAEnum(StudentStatus), default=StudentStatus.ACTIVO)

    # Preferencias de horario
    can_morning = Column(Boolean, default=False)
    can_afternoon = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500), nullable=True)
