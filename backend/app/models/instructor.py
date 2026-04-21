from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from app.db.base import Base
import enum


class VehicleType(str, enum.Enum):
    MOTO = "moto"
    CARRO_B1 = "carro_b1"
    CARRO_C1 = "carro_c1"


class Shift(str, enum.Enum):
    MANANA = "manana"      # 6:00 - 14:00
    TARDE = "tarde"        # 14:00 - 22:00


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    document = Column(String(20), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    vehicle_type = Column(SAEnum(VehicleType), nullable=False)
    shift = Column(SAEnum(Shift), nullable=False)
    is_active = Column(Boolean, default=True)
