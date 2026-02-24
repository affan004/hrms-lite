export type AttendanceStatus = "Present" | "Absent";

export interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  present_days: number;
  created_at: string;
}

export interface EmployeeInput {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  full_name: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface AttendanceInput {
  employee_id: string;
  date: string;
  status: AttendanceStatus;
}

export interface DashboardSummary {
  total_employees: number;
  total_attendance_entries: number;
  today_present: number;
  today_absent: number;
}

export interface ApiErrorPayload {
  message?: string;
  detail?: string;
  details?: unknown;
}

