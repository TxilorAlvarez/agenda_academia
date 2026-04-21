from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class AvailabilityCreate(BaseModel):
    instructor_id: int
    date: date
    start_time: time
    end_time: time
    is_available: bool = True


class AvailabilityOut(BaseModel):
    id: int
    instructor_id: int
    date: date
    start_time: time
    end_time: time
    is_available: bool

    class Config:
        from_attributes = True


class SlotOut(BaseModel):
    date: str
    start_time: str
    end_time: str
    shift: str
    total_instructors: int
    booked: int
    available: int
    status: str
