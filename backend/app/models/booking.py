from sqlalchemy import (
    Column, Integer, String, Date, Time,
    ForeignKey, Enum as SAEnum, DateTime, UniqueConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class BookingStatus(str, enum.Enum):
    RESERVADA = "reservada"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_ASISTIO = "no_asistio"
    EN_ESPERA = "en_espera"


class BookingType(str, enum.Enum):
    PRACTICA = "practica"
    EXAMEN = "examen"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    booking_type = Column(SAEnum(BookingType), default=BookingType.PRACTICA)
    status = Column(SAEnum(BookingStatus), default=BookingStatus.RESERVADA)

    # Numero de hora (ej: hora 3 de 20 para B1)
    hour_number = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(300), nullable=True)

    # Relaciones
    student = relationship("Student", backref="bookings")
    instructor = relationship("Instructor", backref="bookings")
    vehicle = relationship("Vehicle", backref="bookings")

    # Un instructor no puede tener 2 clases al mismo tiempo
    __table_args__ = (
        UniqueConstraint(
            "instructor_id", "date", "start_time",
            name="uq_instructor_datetime"
        ),
    )
