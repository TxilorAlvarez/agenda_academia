cat > README.md <<'EOF'
# Agenda Academia

Sistema de agendamiento de prácticas de conducción para academias de manejo.

## Características

- **Panel administrativo** completo
- **CRUD** de instructores, alumnos y vehículos
- **Reservas** con bloques de 2 horas (práctica) y 1 hora (examen)
- **Validación anti-solapamiento** de horarios
- **Progreso de alumnos** con barra visual
- **Disponibilidad en tiempo real** por fecha y tipo de vehículo
- **Importación masiva CSV** de alumnos e instructores
- **Descarga de plantillas CSV**

## Categorías soportadas

| Categoría | Horas práctica | Hora examen | Total |
|-----------|---------------|-------------|-------|
| Moto      | 14            | 1           | 15    |
| Carro B1  | 19            | 1           | 20    |
| Carro C1  | 29            | 1           | 30    |

## Turnos

- Mañana: 6:00 AM - 2:00 PM
- Tarde/Noche: 2:00 PM - 10:00 PM

## Tech Stack

- **Backend:** Python / FastAPI / SQLAlchemy
- **Frontend:** HTML / CSS / JavaScript (vanilla)
- **Base de datos:** SQLite (dev) / PostgreSQL (prod)
- **Deploy:** Render (backend) + Vercel (frontend)

## Desarrollo local

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

## Frontend 

cd frontend
python3 -m http.server 5500