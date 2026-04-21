from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime


class BookingCreate(BaseModel):
    student_id: int
    instructor_id: int
    vehicle_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    booking_type: str = "practica"   # practica, examen
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    instructor_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    student_id: int
    instructor_id: int
    vehicle_id: Optional[int]
    date: date
    start_time: time
    end_time: time
    booking_type: str
    status: str
    hour_number: Optional[int]
    created_at: Optional[datetime]
    notes: Optional[str]

    # Info relacionada
    student_name: Optional[str] = None
    instructor_name: Optional[str] = None

    class Config:
        from_attributes = True
