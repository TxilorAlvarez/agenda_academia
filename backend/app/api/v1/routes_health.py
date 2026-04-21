from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Instructor, Student, Vehicle, Booking

router = APIRouter(tags=["Health"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Dashboard rapido con numeros clave."""
    return {
        "instructors_active": db.query(Instructor).filter(Instructor.is_active == True).count(),
        "students_active": db.query(Student).filter(Student.status == "activo").count(),
        "vehicles_active": db.query(Vehicle).filter(Vehicle.is_active == True).count(),
        "bookings_total": db.query(Booking).count(),
        "bookings_pending": db.query(Booking).filter(Booking.status == "reservada").count(),
        "bookings_completed": db.query(Booking).filter(Booking.status == "completada").count(),
    }
