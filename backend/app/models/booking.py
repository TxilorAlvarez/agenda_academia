from sqlalchemy import (
    Column, Integer, String, Date, Time,
    ForeignKey, DateTime, UniqueConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    booking_type = Column(String(20), default="practica")   # practica, examen
    status = Column(String(20), default="reservada")        # reservada, completada, cancelada, no_asistio, en_espera

    hour_number = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(300), nullable=True)

    student = relationship("Student", backref="bookings")
    instructor = relationship("Instructor", backref="bookings")
    vehicle = relationship("Vehicle", backref="bookings")

    __table_args__ = (
        UniqueConstraint(
            "instructor_id", "date", "start_time",
            name="uq_instructor_datetime"
        ),
    )
