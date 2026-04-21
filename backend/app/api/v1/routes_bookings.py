from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, time, datetime, timedelta

from app.db.session import get_db
from app.models.booking import Booking
from app.models.instructor import Instructor
from app.models.student import Student
from app.schemas.booking import BookingCreate, BookingUpdate, BookingOut

router = APIRouter(prefix="/bookings", tags=["Reservas"])


def check_instructor_conflict(db: Session, instructor_id: int, book_date: date, start: time, end: time, exclude_id: int = None):
    """Verifica que el instructor no tenga otra clase que se solape."""
    query = db.query(Booking).filter(
        and_(
            Booking.instructor_id == instructor_id,
            Booking.date == book_date,
            Booking.status.in_(["reservada", "en_espera"]),
            # Solapamiento: la clase existente empieza antes de que termine la nueva
            # Y termina despues de que empiece la nueva
            Booking.start_time < end,
            Booking.end_time > start,
        )
    )
    if exclude_id:
        query = query.filter(Booking.id != exclude_id)
    return query.first()


def check_student_conflict(db: Session, student_id: int, book_date: date, start: time, end: time, exclude_id: int = None):
    """Verifica que el alumno no tenga otra clase que se solape."""
    query = db.query(Booking).filter(
        and_(
            Booking.student_id == student_id,
            Booking.date == book_date,
            Booking.status.in_(["reservada", "en_espera"]),
            Booking.start_time < end,
            Booking.end_time > start,
        )
    )
    if exclude_id:
        query = query.filter(Booking.id != exclude_id)
    return query.first()


def validate_block_duration(start: time, end: time, booking_type: str):
    """Valida que practica sea 2h y examen sea 1h."""
    start_dt = datetime(2000, 1, 1, start.hour, start.minute)
    end_dt = datetime(2000, 1, 1, end.hour, end.minute)
    diff = (end_dt - start_dt).seconds / 3600

    if booking_type == "practica" and diff != 2:
        return False, "Las practicas deben ser bloques de 2 horas"
    if booking_type == "examen" and diff != 1:
        return False, "Los examenes deben ser bloques de 1 hora"
    return True, ""


@router.get("/", response_model=List[BookingOut])
def list_bookings(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    student_id: Optional[int] = None,
    instructor_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if date_from:
        query = query.filter(Booking.date >= date_from)
    if date_to:
        query = query.filter(Booking.date <= date_to)
    if student_id:
        query = query.filter(Booking.student_id == student_id)
    if instructor_id:
        query = query.filter(Booking.instructor_id == instructor_id)
    if status:
        query = query.filter(Booking.status == status)

    bookings = query.order_by(Booking.date, Booking.start_time).all()

    result = []
    for b in bookings:
        out = BookingOut.model_validate(b)
        student = db.query(Student).filter(Student.id == b.student_id).first()
        instructor = db.query(Instructor).filter(Instructor.id == b.instructor_id).first()
        out.student_name = student.full_name if student else None
        out.instructor_name = instructor.full_name if instructor else None
        result.append(out)

    return result


@router.post("/", response_model=BookingOut, status_code=201)
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    # 1. Validar duracion del bloque
    valid, msg = validate_block_duration(data.start_time, data.end_time, data.booking_type)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    # 2. Verificar alumno
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    # 3. Verificar instructor
    instructor = db.query(Instructor).filter(Instructor.id == data.instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")
    if not instructor.is_active:
        raise HTTPException(status_code=400, detail="El instructor no esta activo")

    # 4. Verificar conflicto instructor
    conflict = check_instructor_conflict(db, data.instructor_id, data.date, data.start_time, data.end_time)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"El instructor ya tiene una clase el {data.date} de {conflict.start_time} a {conflict.end_time}"
        )

    # 5. Verificar conflicto alumno
    student_conflict = check_student_conflict(db, data.student_id, data.date, data.start_time, data.end_time)
    if student_conflict:
        raise HTTPException(
            status_code=409,
            detail=f"El alumno ya tiene una clase el {data.date} de {student_conflict.start_time} a {student_conflict.end_time}"
        )

    # 6. Verificar horas del alumno
    completed = student.hours_completed or 0
    hours_practice = student.total_hours_required - 1  # Menos la hora de examen

    if data.booking_type == "examen":
        # Solo puede agendar examen si ya completo TODAS las practicas
        if completed < hours_practice:
            raise HTTPException(
                status_code=400,
                detail=f"El alumno necesita completar {hours_practice} horas de practica antes del examen. Lleva {completed}."
            )
    else:
        # Verificar que no haya excedido las horas de practica
        if completed >= hours_practice:
            raise HTTPException(
                status_code=400,
                detail=f"El alumno ya completo todas sus horas de practica ({completed}/{hours_practice}). Solo falta el examen."
            )

    # 7. Calcular numero de hora
    hour_number = completed + 1

    # 8. Crear reserva
    booking = Booking(
        student_id=data.student_id,
        instructor_id=data.instructor_id,
        vehicle_id=data.vehicle_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        booking_type=data.booking_type,
        hour_number=hour_number,
        notes=data.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.put("/{booking_id}/complete")
def complete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if booking.status != "reservada":
        raise HTTPException(status_code=400, detail=f"No se puede completar una reserva con estado '{booking.status}'")

    booking.status = "completada"

    student = db.query(Student).filter(Student.id == booking.student_id).first()
    if student:
        if booking.booking_type == "practica":
            # Practica = sumar 2 horas (bloque de 2h)
            student.hours_completed = (student.hours_completed or 0) + 2
        elif booking.booking_type == "examen":
            # Examen = sumar 1 hora
            student.hours_completed = (student.hours_completed or 0) + 1

        if student.hours_completed >= student.total_hours_required:
            student.status = "completado"

    db.commit()
    return {
        "detail": "Clase completada",
        "hours_completed": student.hours_completed if student else None,
        "total_required": student.total_hours_required if student else None,
    }


@router.put("/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    booking.status = "cancelada"
    db.commit()
    return {"detail": "Reserva cancelada"}


@router.put("/{booking_id}/no-show")
def no_show_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    booking.status = "no_asistio"
    db.commit()
    return {"detail": "Marcado como no asistio"}
