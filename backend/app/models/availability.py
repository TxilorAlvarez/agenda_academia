from sqlalchemy import (
    Column, Integer, Date, Time, Boolean,
    ForeignKey, UniqueConstraint
)
from app.db.base import Base


class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"

    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("instructors.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint(
            "instructor_id", "date", "start_time",
            name="uq_availability_slot"
        ),
    )
