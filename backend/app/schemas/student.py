from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    full_name: str
    document: str
    phone: str
    email: Optional[str] = None
    category: str           # moto, carro_b1, carro_c1
    can_morning: bool = False
    can_afternoon: bool = False
    notes: Optional[str] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    can_morning: Optional[bool] = None
    can_afternoon: Optional[bool] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    full_name: str
    document: str
    phone: str
    email: Optional[str]
    category: str
    total_hours_required: int
    hours_completed: int
    status: str
    can_morning: bool
    can_afternoon: bool
    created_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


class StudentProgress(BaseModel):
    id: int
    full_name: str
    category: str
    total_hours_required: int
    hours_completed: int
    hours_remaining: int
    progress_percent: float
    status: str
