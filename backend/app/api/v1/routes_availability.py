from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import date, time

from app.db.session import get_db
from app.models.booking import Booking
from app.models.instructor import Instructor

router = APIRouter(prefix="/availability", tags=["Disponibilidad"])

# Bloques de 2 HORAS (practica normal)
MORNING_SLOTS = [
    ("06:00", "08:00"),
    ("08:00", "10:00"),
    ("10:00", "12:00"),
    ("12:00", "14:00"),
]

AFTERNOON_SLOTS = [
    ("14:00", "16:00"),
    ("16:00", "18:00"),
    ("18:00", "20:00"),
    ("20:00", "22:00"),
]

# Bloques de 1 HORA (solo para examen)
EXAM_MORNING_SLOTS = [
    ("06:00", "07:00"), ("07:00", "08:00"),
    ("08:00", "09:00"), ("09:00", "10:00"),
    ("10:00", "11:00"), ("11:00", "12:00"),
    ("12:00", "13:00"), ("13:00", "14:00"),
]

EXAM_AFTERNOON_SLOTS = [
    ("14:00", "15:00"), ("15:00", "16:00"),
    ("16:00", "17:00"), ("17:00", "18:00"),
    ("18:00", "19:00"), ("19:00", "20:00"),
    ("20:00", "21:00"), ("21:00", "22:00"),
]


@router.get("/slots")
def get_available_slots(
    query_date: date = Query(..., alias="date"),
    vehicle_type: Optional[str] = None,
    booking_type: str = Query("practica"),
    db: Session = Depends(get_db),
):
    if booking_type == "examen":
        all_slots = EXAM_MORNING_SLOTS + EXAM_AFTERNOON_SLOTS
    else:
        all_slots = MORNING_SLOTS + AFTERNOON_SLOTS

    result = []

    for slot_start, slot_end in all_slots:
        start_t = time.fromisoformat(slot_start)
        end_t = time.fromisoformat(slot_end)

        shift = "manana" if start_t < time(14, 0) else "tarde"

        instructors_query = db.query(Instructor).filter(
            and_(
                Instructor.is_active == True,
                Instructor.shift == shift,
            )
        )
        if vehicle_type:
            instructors_query = instructors_query.filter(
                Instructor.vehicle_type == vehicle_type
            )

        total_instructors = instructors_query.count()

        # Verificar reservas que se solapan con este bloque
        booked = db.query(Booking).filter(
            and_(
                Booking.date == query_date,
                Booking.start_time >= start_t,
                Booking.start_time < end_t,
                Booking.status.in_(["reservada", "en_espera"]),
            )
        )
        if vehicle_type:
            instructor_ids = [i.id for i in instructors_query.all()]
            booked = booked.filter(Booking.instructor_id.in_(instructor_ids))

        booked_count = booked.count()
        available = max(total_instructors - booked_count, 0)

        if available == 0:
            status = "lleno"
        elif available <= 2:
            status = "pocas_plazas"
        else:
            status = "disponible"

        result.append({
            "date": str(query_date),
            "start_time": slot_start,
            "end_time": slot_end,
            "shift": shift,
            "total_instructors": total_instructors,
            "booked": booked_count,
            "available": available,
            "status": status,
            "duration": "2h" if booking_type == "practica" else "1h",
        })

    return result


@router.get("/free-instructors")
def get_free_instructors(
    query_date: date = Query(..., alias="date"),
    start_time_param: time = Query(..., alias="start_time"),
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    shift = "manana" if start_time_param < time(14, 0) else "tarde"

    instructors_query = db.query(Instructor).filter(
        and_(
            Instructor.is_active == True,
            Instructor.shift == shift,
        )
    )
    if vehicle_type:
        instructors_query = instructors_query.filter(
            Instructor.vehicle_type == vehicle_type
        )

    all_instructors = instructors_query.all()

    booked_ids = db.query(Booking.instructor_id).filter(
        and_(
            Booking.date == query_date,
            Booking.start_time == start_time_param,
            Booking.status.in_(["reservada", "en_espera"]),
        )
    ).all()
    booked_ids = [b[0] for b in booked_ids]

    free = [i for i in all_instructors if i.id not in booked_ids]

    return [
        {
            "id": i.id,
            "full_name": i.full_name,
            "vehicle_type": i.vehicle_type.value if hasattr(i.vehicle_type, 'value') else i.vehicle_type,
            "shift": i.shift.value if hasattr(i.shift, 'value') else i.shift,
        }
        for i in free
    ]
