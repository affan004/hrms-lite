import type {
  ApiErrorPayload,
  AttendanceInput,
  AttendanceRecord,
  DashboardSummary,
  Employee,
  EmployeeInput,
} from "./types";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000")
  .trim()
  .replace(/\/+$/, "");

export class ApiError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: ApiErrorPayload | null = null;

  if (text) {
    try {
      parsed = JSON.parse(text) as ApiErrorPayload;
    } catch {
      parsed = { message: text };
    }
  }

  if (!response.ok) {
    const errorMessage = parsed?.message || parsed?.detail || "Unexpected API error.";
    throw new ApiError(errorMessage, parsed?.details);
  }

  return parsed as T;
}

export const api = {
  getEmployees: () => request<Employee[]>("/api/employees"),
  createEmployee: (payload: EmployeeInput) =>
    request<Employee>("/api/employees", { method: "POST", body: JSON.stringify(payload) }),
  deleteEmployee: (employeeId: string) => request<void>(`/api/employees/${employeeId}`, { method: "DELETE" }),
  getAttendance: (employeeId?: string, date?: string) => {
    const params = new URLSearchParams();
    if (employeeId) params.set("employee_id", employeeId);
    if (date) params.set("date", date);
    const query = params.toString();
    return request<AttendanceRecord[]>(`/api/attendance${query ? `?${query}` : ""}`);
  },
  createAttendance: (payload: AttendanceInput) =>
    request<AttendanceRecord>("/api/attendance", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getDashboardSummary: () => request<DashboardSummary>("/api/dashboard/summary"),
};
