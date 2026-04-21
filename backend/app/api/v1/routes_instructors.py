from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.instructor import Instructor
from app.schemas.instructor import InstructorCreate, InstructorUpdate, InstructorOut

router = APIRouter(prefix="/instructors", tags=["Instructores"])


@router.get("/", response_model=List[InstructorOut])
def list_instructors(
    active_only: bool = False,
    vehicle_type: str = None,
    shift: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Instructor)
    if active_only:
        query = query.filter(Instructor.is_active == True)
    if vehicle_type:
        query = query.filter(Instructor.vehicle_type == vehicle_type)
    if shift:
        query = query.filter(Instructor.shift == shift)
    return query.all()


@router.get("/{instructor_id}", response_model=InstructorOut)
def get_instructor(instructor_id: int, db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")
    return instructor


@router.post("/", response_model=InstructorOut, status_code=201)
def create_instructor(data: InstructorCreate, db: Session = Depends(get_db)):
    # Verificar documento duplicado
    exists = db.query(Instructor).filter(Instructor.document == data.document).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe un instructor con ese documento")

    instructor = Instructor(**data.model_dump())
    db.add(instructor)
    db.commit()
    db.refresh(instructor)
    return instructor


@router.put("/{instructor_id}", response_model=InstructorOut)
def update_instructor(instructor_id: int, data: InstructorUpdate, db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(instructor, field, value)

    db.commit()
    db.refresh(instructor)
    return instructor


@router.delete("/{instructor_id}")
def delete_instructor(instructor_id: int, db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")

    db.delete(instructor)
    db.commit()
    return {"detail": "Instructor eliminado"}
