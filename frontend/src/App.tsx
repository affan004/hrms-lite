import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, api } from "./api";
import { PanelHeader } from "./components/PanelHeader";
import { StateMessage } from "./components/StateMessage";
import { SummaryCard } from "./components/SummaryCard";
import type {
  AttendanceInput,
  AttendanceRecord,
  DashboardSummary,
  Employee,
  EmployeeInput,
} from "./types";

function getLocalIsoDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

const today = getLocalIsoDate();

const emptySummary: DashboardSummary = {
  total_employees: 0,
  total_attendance_entries: 0,
  today_present: 0,
  today_absent: 0,
};

const emptyEmployeeForm: EmployeeInput = {
  employee_id: "",
  full_name: "",
  email: "",
  department: "",
};

const emptyAttendanceForm: AttendanceInput = {
  employee_id: "",
  date: today,
  status: "Present",
};

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred.";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);

  const [employeeForm, setEmployeeForm] = useState<EmployeeInput>(emptyEmployeeForm);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceInput>(emptyAttendanceForm);

  const [attendanceFilterEmployeeId, setAttendanceFilterEmployeeId] = useState("");
  const [attendanceFilterDate, setAttendanceFilterDate] = useState("");

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  const [employeeListError, setEmployeeListError] = useState<string | null>(null);
  const [attendanceListError, setAttendanceListError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [employeeActionError, setEmployeeActionError] = useState<string | null>(null);
  const [attendanceActionError, setAttendanceActionError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    setEmployeeListError(null);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (error) {
      setEmployeeListError(toErrorMessage(error));
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setIsLoadingAttendance(true);
    setAttendanceListError(null);
    try {
      const data = await api.getAttendance(attendanceFilterEmployeeId || undefined, attendanceFilterDate || undefined);
      setAttendanceRecords(data);
    } catch (error) {
      setAttendanceListError(toErrorMessage(error));
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [attendanceFilterDate, attendanceFilterEmployeeId]);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      setSummaryError(toErrorMessage(error));
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
    void fetchSummary();
  }, [fetchEmployees, fetchSummary]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Employees", value: summary.total_employees },
      { label: "Attendance Entries", value: summary.total_attendance_entries },
      { label: "Present Today", value: summary.today_present },
      { label: "Absent Today", value: summary.today_absent },
    ],
    [summary]
  );

  const handleEmployeeInput = (field: keyof EmployeeInput, value: string) => {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttendanceInput = (field: keyof AttendanceInput, value: string) => {
    setAttendanceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmployeeActionError(null);
    setIsSubmittingEmployee(true);
    try {
      await api.createEmployee({
        employee_id: employeeForm.employee_id.trim(),
        full_name: employeeForm.full_name.trim(),
        email: employeeForm.email.trim(),
        department: employeeForm.department.trim(),
      });
      setEmployeeForm(emptyEmployeeForm);
      await Promise.all([fetchEmployees(), fetchSummary()]);
    } catch (error) {
      setEmployeeActionError(toErrorMessage(error));
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm(`Delete employee ${employeeId}? This will remove related attendance records.`)) {
      return;
    }
    setEmployeeActionError(null);
    try {
      await api.deleteEmployee(employeeId);
      if (attendanceFilterEmployeeId === employeeId) {
        setAttendanceFilterEmployeeId("");
      }
      if (attendanceForm.employee_id === employeeId) {
        setAttendanceForm((prev) => ({ ...prev, employee_id: "" }));
      }
      await Promise.all([fetchEmployees(), fetchAttendance(), fetchSummary()]);
    } catch (error) {
      setEmployeeActionError(toErrorMessage(error));
    }
  };

  const handleMarkAttendance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttendanceActionError(null);
    setIsSubmittingAttendance(true);
    try {
      await api.createAttendance({
        employee_id: attendanceForm.employee_id,
        date: attendanceForm.date,
        status: attendanceForm.status,
      });
      await Promise.all([fetchAttendance(), fetchEmployees(), fetchSummary()]);
    } catch (error) {
      setAttendanceActionError(toErrorMessage(error));
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <header className="hero">
        <h1>HRMS Lite</h1>
        <p>Manage employees and daily attendance with production-ready flows.</p>
      </header>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      {(isLoadingSummary || summaryError) && (
        <div className="status-strip">
          {isLoadingSummary && <StateMessage message="Refreshing dashboard summary..." />}
          {summaryError && <StateMessage tone="error" message={summaryError} />}
        </div>
      )}

      <section className="workspace-grid">
        <article className="panel">
          <PanelHeader title="Employee Management" subtitle="Add, review, and remove employee records." />
          <form className="form-grid" onSubmit={handleCreateEmployee}>
            <label>
              Employee ID
              <input
                type="text"
                value={employeeForm.employee_id}
                onChange={(event) => handleEmployeeInput("employee_id", event.target.value)}
                placeholder="EMP-001"
                required
              />
            </label>
            <label>
              Full Name
              <input
                type="text"
                value={employeeForm.full_name}
                onChange={(event) => handleEmployeeInput("full_name", event.target.value)}
                placeholder="Ava Martinez"
                required
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={employeeForm.email}
                onChange={(event) => handleEmployeeInput("email", event.target.value)}
                placeholder="ava.martinez@company.com"
                required
              />
            </label>
            <label>
              Department
              <input
                type="text"
                value={employeeForm.department}
                onChange={(event) => handleEmployeeInput("department", event.target.value)}
                placeholder="Engineering"
                required
              />
            </label>
            <button className="primary-btn" type="submit" disabled={isSubmittingEmployee}>
              {isSubmittingEmployee ? "Saving..." : "Add Employee"}
            </button>
          </form>

          {employeeActionError && <StateMessage tone="error" message={employeeActionError} />}

          {isLoadingEmployees && <StateMessage message="Loading employees..." />}
          {employeeListError && <StateMessage tone="error" message={employeeListError} />}
          {!isLoadingEmployees && !employeeListError && employees.length === 0 && (
            <StateMessage tone="warning" message="No employees yet. Add your first employee to begin." />
          )}

          {!isLoadingEmployees && !employeeListError && employees.length > 0 && (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Present Days</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_id}>
                      <td>{employee.employee_id}</td>
                      <td>{employee.full_name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.department}</td>
                      <td>{employee.present_days}</td>
                      <td>
                        <button
                          className="danger-btn"
                          type="button"
                          onClick={() => handleDeleteEmployee(employee.employee_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel">
          <PanelHeader title="Attendance Management" subtitle="Mark attendance and review attendance history." />
          <form className="form-grid" onSubmit={handleMarkAttendance}>
            <label>
              Employee
              <select
                value={attendanceForm.employee_id}
                onChange={(event) => handleAttendanceInput("employee_id", event.target.value)}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.full_name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(event) => handleAttendanceInput("date", event.target.value)}
                max={today}
                required
              />
            </label>
            <label>
              Status
              <select
                value={attendanceForm.status}
                onChange={(event) => handleAttendanceInput("status", event.target.value)}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </label>
            <button className="primary-btn" type="submit" disabled={isSubmittingAttendance}>
              {isSubmittingAttendance ? "Saving..." : "Mark Attendance"}
            </button>
          </form>

          {attendanceActionError && <StateMessage tone="error" message={attendanceActionError} />}

          <div className="filter-row">
            <label>
              Filter by Employee
              <select
                value={attendanceFilterEmployeeId}
                onChange={(event) => setAttendanceFilterEmployeeId(event.target.value)}
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.full_name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Filter by Date
              <input
                type="date"
                value={attendanceFilterDate}
                onChange={(event) => setAttendanceFilterDate(event.target.value)}
                max={today}
              />
            </label>
            <button className="secondary-btn" type="button" onClick={() => setAttendanceFilterDate("")}>
              Clear Date
            </button>
          </div>

          {isLoadingAttendance && <StateMessage message="Loading attendance records..." />}
          {attendanceListError && <StateMessage tone="error" message={attendanceListError} />}
          {!isLoadingAttendance && !attendanceListError && attendanceRecords.length === 0 && (
            <StateMessage tone="warning" message="No attendance records found for the selected filters." />
          )}

          {!isLoadingAttendance && !attendanceListError && attendanceRecords.length > 0 && (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>
                        {record.full_name} ({record.employee_id})
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            record.status === "Present" ? "status-present" : "status-absent"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
