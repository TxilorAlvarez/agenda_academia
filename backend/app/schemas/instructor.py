from pydantic import BaseModel
from typing import Optional


class InstructorCreate(BaseModel):
    full_name: str
    document: str
    phone: Optional[str] = None
    vehicle_type: str   # moto, carro_b1, carro_c1
    shift: str          # manana, tarde
    is_active: bool = True


class InstructorUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    shift: Optional[str] = None
    is_active: Optional[bool] = None


class InstructorOut(BaseModel):
    id: int
    full_name: str
    document: str
    phone: Optional[str]
    vehicle_type: str
    shift: str
    is_active: bool

    class Config:
        from_attributes = True
