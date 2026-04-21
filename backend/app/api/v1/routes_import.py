from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import csv
import io

from app.db.session import get_db
from app.models.student import Student
from app.models.instructor import Instructor

router = APIRouter(prefix="/import", tags=["Importacion Masiva"])

# Horas por categoria
HOURS_MAP = {
    "moto": 15,
    "carro_b1": 20,
    "carro_c1": 30,
}


@router.post("/students")
async def import_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importar alumnos desde un archivo CSV.

    Columnas esperadas:
    full_name, document, phone, email, category, hours_completed, can_morning, can_afternoon, notes

    - category: moto | carro_b1 | carro_c1
    - hours_completed: numero (cuantas horas ya lleva)
    - can_morning: si | no  (o true | false, o 1 | 0)
    - can_afternoon: si | no
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo debe ser .csv")

    content = await file.read()

    # Intentar decodificar con utf-8, si falla probar latin-1
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    # Validar que tenga las columnas minimas
    required_cols = {"full_name", "document", "phone", "category"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"El CSV debe tener al menos estas columnas: {', '.join(required_cols)}. "
                   f"Columnas encontradas: {', '.join(reader.fieldnames or [])}"
        )

    created = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            # Limpiar espacios
            full_name = row.get("full_name", "").strip()
            document = row.get("document", "").strip()
            phone = row.get("phone", "").strip()
            email = row.get("email", "").strip() or None
            category = row.get("category", "").strip().lower()
            hours_str = row.get("hours_completed", "0").strip()
            can_morning_str = row.get("can_morning", "no").strip().lower()
            can_afternoon_str = row.get("can_afternoon", "no").strip().lower()
            notes = row.get("notes", "").strip() or None

            # Validaciones basicas
            if not full_name or not document or not phone:
                errors.append(f"Fila {row_num}: nombre, documento o telefono vacio")
                skipped += 1
                continue

            if category not in HOURS_MAP:
                errors.append(f"Fila {row_num}: categoria '{category}' no valida. Usar: moto, carro_b1, carro_c1")
                skipped += 1
                continue

            # Verificar si ya existe
            exists = db.query(Student).filter(Student.document == document).first()
            if exists:
                errors.append(f"Fila {row_num}: documento {document} ya existe ({exists.full_name}) - omitido")
                skipped += 1
                continue

            # Parsear horas completadas
            try:
                hours_completed = int(hours_str) if hours_str else 0
            except ValueError:
                hours_completed = 0

            # Parsear booleanos
            truthy = {"si", "sí", "yes", "true", "1", "x"}
            can_morning = can_morning_str in truthy
            can_afternoon = can_afternoon_str in truthy

            # Calcular total de horas
            total_hours = HOURS_MAP[category]

            # Determinar estado
            if hours_completed >= total_hours:
                status = "completado"
            elif hours_completed > 0:
                status = "activo"
            else:
                status = "activo"

            student = Student(
                full_name=full_name,
                document=document,
                phone=phone,
                email=email,
                category=category,
                total_hours_required=total_hours,
                hours_completed=min(hours_completed, total_hours),
                status=status,
                can_morning=can_morning,
                can_afternoon=can_afternoon,
                notes=notes,
            )
            db.add(student)
            created += 1

        except Exception as e:
            errors.append(f"Fila {row_num}: error inesperado - {str(e)}")
            skipped += 1

    db.commit()

    return {
        "message": f"Importacion completada: {created} creados, {skipped} omitidos",
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }


@router.post("/instructors")
async def import_instructors_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Importar instructores desde CSV.

    Columnas: full_name, document, phone, vehicle_type, shift
    - vehicle_type: moto | carro_b1 | carro_c1
    - shift: manana | tarde
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo debe ser .csv")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    required_cols = {"full_name", "document", "vehicle_type", "shift"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"Columnas requeridas: {', '.join(required_cols)}"
        )

    created = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            full_name = row.get("full_name", "").strip()
            document = row.get("document", "").strip()
            phone = row.get("phone", "").strip() or None
            vehicle_type = row.get("vehicle_type", "").strip().lower()
            shift = row.get("shift", "").strip().lower()

            if not full_name or not document:
                errors.append(f"Fila {row_num}: nombre o documento vacio")
                skipped += 1
                continue

            if vehicle_type not in ["moto", "carro_b1", "carro_c1"]:
                errors.append(f"Fila {row_num}: vehicle_type '{vehicle_type}' no valido")
                skipped += 1
                continue

            if shift not in ["manana", "tarde"]:
                errors.append(f"Fila {row_num}: shift '{shift}' no valido. Usar: manana, tarde")
                skipped += 1
                continue

            exists = db.query(Instructor).filter(Instructor.document == document).first()
            if exists:
                errors.append(f"Fila {row_num}: documento {document} ya existe - omitido")
                skipped += 1
                continue

            instructor = Instructor(
                full_name=full_name,
                document=document,
                phone=phone,
                vehicle_type=vehicle_type,
                shift=shift,
                is_active=True,
            )
            db.add(instructor)
            created += 1

        except Exception as e:
            errors.append(f"Fila {row_num}: {str(e)}")
            skipped += 1

    db.commit()

    return {
        "message": f"Importacion completada: {created} creados, {skipped} omitidos",
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }
