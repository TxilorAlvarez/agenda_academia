from sqlalchemy import Column, Integer, String, Boolean
from app.db.base import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    document = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    vehicle_type = Column(String(20), nullable=False)   # moto, carro_b1, carro_c1
    shift = Column(String(20), nullable=False)           # manana, tarde
    is_active = Column(Boolean, default=True)
