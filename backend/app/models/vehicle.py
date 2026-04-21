from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from app.db.base import Base
from app.models.instructor import VehicleType


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(10), unique=True, nullable=False)      # Placa
    vehicle_type = Column(SAEnum(VehicleType), nullable=False)    # moto, b1, c1
    brand = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
