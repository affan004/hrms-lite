from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attendance, AttendanceStatus, Employee
from ..schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    today = date.today()

    total_employees = db.scalar(select(func.count(Employee.id))) or 0
    total_attendance_entries = db.scalar(select(func.count(Attendance.id))) or 0
    today_present = (
        db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        )
        or 0
    )
    today_absent = (
        db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.ABSENT,
            )
        )
        or 0
    )

    return DashboardSummary(
        total_employees=int(total_employees),
        total_attendance_entries=int(total_attendance_entries),
        today_present=int(today_present),
        today_absent=int(today_absent),
    )

