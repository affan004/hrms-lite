from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attendance, AttendanceStatus, Employee
from ..schemas import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="/api/employees", tags=["Employees"])


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)) -> EmployeeResponse:
    existing_by_id = db.scalar(select(Employee).where(Employee.employee_id == payload.employee_id))
    if existing_by_id:
        raise HTTPException(status_code=409, detail="Employee ID already exists.")

    existing_by_email = db.scalar(select(Employee).where(Employee.email == payload.email))
    if existing_by_email:
        raise HTTPException(status_code=409, detail="Email address already exists.")

    employee = Employee(
        employee_id=payload.employee_id,
        full_name=payload.full_name,
        email=payload.email,
        department=payload.department,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return EmployeeResponse(
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        email=employee.email,
        department=employee.department,
        present_days=0,
        created_at=employee.created_at,
    )


@router.get("", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)) -> list[EmployeeResponse]:
    present_days = func.coalesce(
        func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)),
        0,
    ).label("present_days")

    statement = (
        select(Employee, present_days)
        .outerjoin(Attendance, Attendance.employee_pk == Employee.id)
        .group_by(
            Employee.id,
            Employee.employee_id,
            Employee.full_name,
            Employee.email,
            Employee.department,
            Employee.created_at,
        )
        .order_by(Employee.created_at.desc())
    )
    rows = db.execute(statement).all()

    return [
        EmployeeResponse(
            employee_id=employee.employee_id,
            full_name=employee.full_name,
            email=employee.email,
            department=employee.department,
            present_days=int(present_count or 0),
            created_at=employee.created_at,
        )
        for employee, present_count in rows
    ]


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: Session = Depends(get_db)) -> Response:
    employee = db.scalar(select(Employee).where(Employee.employee_id == employee_id))
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    db.delete(employee)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

