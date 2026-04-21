from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut, StudentProgress

router = APIRouter(prefix="/students", tags=["Alumnos"])

# Horas por categoria
HOURS_MAP = {
    "moto": 15,
    "carro_b1": 20,
    "carro_c1": 30,
}


@router.get("/", response_model=List[StudentOut])
def list_students(
    status: str = None,
    category: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Student)
    if status:
        query = query.filter(Student.status == status)
    if category:
        query = query.filter(Student.category == category)
    return query.order_by(Student.created_at.desc()).all()


@router.get("/progress", response_model=List[StudentProgress])
def list_progress(db: Session = Depends(get_db)):
    """Ver progreso de todos los alumnos activos."""
    students = db.query(Student).filter(Student.status == "activo").all()
    result = []
    for s in students:
        remaining = s.total_hours_required - s.hours_completed
        percent = (s.hours_completed / s.total_hours_required * 100) if s.total_hours_required > 0 else 0
        result.append(StudentProgress(
            id=s.id,
            full_name=s.full_name,
            category=s.category.value if hasattr(s.category, 'value') else s.category,
            total_hours_required=s.total_hours_required,
            hours_completed=s.hours_completed,
            hours_remaining=max(remaining, 0),
            progress_percent=round(percent, 1),
            status=s.status.value if hasattr(s.status, 'value') else s.status,
        ))
    return result


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return student


@router.post("/", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    # Verificar documento duplicado
    exists = db.query(Student).filter(Student.document == data.document).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe un alumno con ese documento")

    # Asignar horas segun categoria
    total_hours = HOURS_MAP.get(data.category, 20)

    student = Student(
        **data.model_dump(),
        total_hours_required=total_hours,
        hours_completed=0,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    db.delete(student)
    db.commit()
    return {"detail": "Alumno eliminado"}
