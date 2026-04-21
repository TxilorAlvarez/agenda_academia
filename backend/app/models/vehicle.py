from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(10), unique=True, nullable=False)
    vehicle_type = Column(String(20), nullable=False)    # moto, carro_b1, carro_c1
    brand = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
