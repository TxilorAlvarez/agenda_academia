from pydantic import BaseModel
from typing import Optional


class VehicleCreate(BaseModel):
    plate: str
    vehicle_type: str       # moto, carro_b1, carro_c1
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    is_active: bool = True


class VehicleUpdate(BaseModel):
    plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    is_active: Optional[bool] = None


class VehicleOut(BaseModel):
    id: int
    plate: str
    vehicle_type: str
    brand: Optional[str]
    model: Optional[str]
    year: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True
