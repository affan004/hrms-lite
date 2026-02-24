from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .models import AttendanceStatus


class EmployeeCreate(BaseModel):
    employee_id: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    department: str = Field(min_length=1, max_length=100)

    @field_validator("employee_id", "full_name", "department", mode="before")
    @classmethod
    def validate_required_text(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("Field must be text.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty.")
        return cleaned


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: str
    full_name: str
    email: EmailStr
    department: str
    present_days: int = 0
    created_at: datetime


class AttendanceCreate(BaseModel):
    employee_id: str = Field(min_length=1, max_length=50)
    date: date
    status: AttendanceStatus

    @field_validator("employee_id", mode="before")
    @classmethod
    def validate_employee_id(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("Employee ID must be text.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Employee ID cannot be empty.")
        return cleaned

    @field_validator("date")
    @classmethod
    def validate_attendance_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Attendance date cannot be in the future.")
        return value


class AttendanceResponse(BaseModel):
    id: int
    employee_id: str
    full_name: str
    date: date
    status: AttendanceStatus
    created_at: datetime


class DashboardSummary(BaseModel):
    total_employees: int
    total_attendance_entries: int
    today_present: int
    today_absent: int
