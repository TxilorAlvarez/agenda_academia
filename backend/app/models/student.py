from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    document = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    category = Column(String(20), nullable=False)        # moto, carro_b1, carro_c1

    total_hours_required = Column(Integer, nullable=False)
    hours_completed = Column(Integer, default=0)
    status = Column(String(20), default="activo")        # activo, completado, retirado, pendiente

    can_morning = Column(Boolean, default=False)
    can_afternoon = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500), nullable=True)
