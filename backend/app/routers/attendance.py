from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attendance, Employee
from ..schemas import AttendanceCreate, AttendanceResponse

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _serialize_attendance(record: Attendance, employee: Employee) -> AttendanceResponse:
    return AttendanceResponse(
        id=record.id,
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        date=record.date,
        status=record.status,
        created_at=record.created_at,
    )


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)) -> AttendanceResponse:
    employee = db.scalar(select(Employee).where(Employee.employee_id == payload.employee_id))
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found for attendance marking.")

    existing_record = db.scalar(
        select(Attendance).where(
            Attendance.employee_pk == employee.id,
            Attendance.date == payload.date,
        )
    )
    if existing_record:
        raise HTTPException(
            status_code=409,
            detail="Attendance already marked for this employee on the selected date.",
        )

    record = Attendance(employee_pk=employee.id, date=payload.date, status=payload.status)
    db.add(record)
    db.commit()
    db.refresh(record)

    return _serialize_attendance(record, employee)


@router.get("", response_model=list[AttendanceResponse])
def list_attendance(
    employee_id: Annotated[str | None, Query()] = None,
    date_filter: Annotated[date | None, Query(alias="date")] = None,
    db: Session = Depends(get_db),
) -> list[AttendanceResponse]:
    statement = (
        select(Attendance, Employee)
        .join(Employee, Employee.id == Attendance.employee_pk)
        .order_by(Attendance.date.desc(), Employee.full_name.asc())
    )

    if employee_id:
        statement = statement.where(Employee.employee_id == employee_id.strip())
    if date_filter:
        statement = statement.where(Attendance.date == date_filter)

    rows = db.execute(statement).all()
    return [_serialize_attendance(record, employee) for record, employee in rows]


@router.get("/employee/{employee_id}", response_model=list[AttendanceResponse])
def list_employee_attendance(employee_id: str, db: Session = Depends(get_db)) -> list[AttendanceResponse]:
    employee = db.scalar(select(Employee).where(Employee.employee_id == employee_id))
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    statement = (
        select(Attendance)
        .where(Attendance.employee_pk == employee.id)
        .order_by(Attendance.date.desc(), Attendance.created_at.desc())
    )
    records = db.scalars(statement).all()
    return [_serialize_attendance(record, employee) for record in records]

