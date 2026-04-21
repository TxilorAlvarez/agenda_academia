from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import csv
import io

from app.db.session import get_db
from app.models.booking import Booking
from app.models.instructor import Instructor
from app.models.student import Student

router = APIRouter(prefix="/export", tags=["Exportacion"])


@router.get("/bookings")
def export_bookings(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    instructor_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Exportar reservas a CSV con filtros."""
    query = db.query(Booking)
    if date_from:
        query = query.filter(Booking.date >= date_from)
    if date_to:
        query = query.filter(Booking.date <= date_to)
    if instructor_id:
        query = query.filter(Booking.instructor_id == instructor_id)
    if student_id:
        query = query.filter(Booking.student_id == student_id)
    if status:
        query = query.filter(Booking.status == status)

    bookings = query.order_by(Booking.date, Booking.start_time).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Fecha", "Hora_Inicio", "Hora_Fin", "Tipo",
        "Estado", "Hora_Numero", "Alumno_ID", "Alumno_Nombre",
        "Instructor_ID", "Instructor_Nombre", "Notas"
    ])

    for b in bookings:
        student = db.query(Student).filter(Student.id == b.student_id).first()
        instructor = db.query(Instructor).filter(Instructor.id == b.instructor_id).first()
        writer.writerow([
            b.id, str(b.date), str(b.start_time), str(b.end_time),
            b.booking_type, b.status, b.hour_number or "",
            b.student_id, student.full_name if student else "",
            b.instructor_id, instructor.full_name if instructor else "",
            b.notes or ""
        ])

    output.seek(0)
    filename = "reservas"
    if date_from:
        filename += "_desde_" + str(date_from)
    if date_to:
        filename += "_hasta_" + str(date_to)
    filename += ".csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/students")
def export_students(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Exportar alumnos a CSV."""
    query = db.query(Student)
    if status:
        query = query.filter(Student.status == status)
    if category:
        query = query.filter(Student.category == category)

    students = query.order_by(Student.full_name).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Nombre", "Documento", "Telefono", "Email",
        "Categoria", "Horas_Requeridas", "Horas_Completadas",
        "Estado", "Puede_Manana", "Puede_Tarde", "Notas"
    ])

    for s in students:
        writer.writerow([
            s.id, s.full_name, s.document, s.phone, s.email or "",
            s.category, s.total_hours_required, s.hours_completed,
            s.status, "si" if s.can_morning else "no",
            "si" if s.can_afternoon else "no", s.notes or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alumnos.csv"}
    )


@router.get("/instructors")
def export_instructors(db: Session = Depends(get_db)):
    """Exportar instructores a CSV."""
    instructors = db.query(Instructor).order_by(Instructor.full_name).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Nombre", "Documento", "Telefono", "Tipo_Vehiculo", "Turno", "Activo"])

    for i in instructors:
        writer.writerow([
            i.id, i.full_name, i.document, i.phone or "",
            i.vehicle_type, i.shift, "si" if i.is_active else "no"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=instructores.csv"}
    )
