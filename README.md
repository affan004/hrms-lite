# HRMS Lite

Production-ready HRMS Lite application for managing employees and daily attendance with a clean admin interface.

## Submission Details

- Live Application URL: `https://frontend-green-kappa-83.vercel.app`
- Backend API URL: `https://backend-six-psi-29.vercel.app`
- GitHub Repository URL: `https://github.com/affan004/hrms-lite`

## Project Overview

This project provides:

- Employee management
  - Add employee (`employee_id`, full name, email, department)
  - List all employees
  - Delete employee
- Attendance management
  - Mark attendance by date and status (`Present` / `Absent`)
  - List attendance records
  - Filter attendance by employee and date
- Dashboard summary
  - Total employees
  - Total attendance entries
  - Today's present and absent counts
  - Present-days count per employee

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + SQLAlchemy
- Database:
  - Local: SQLite
  - Production: PostgreSQL (Neon via Vercel Integration)
- Deployment targets:
  - Frontend: Vercel
  - Backend: Vercel (FastAPI) + Neon Postgres

## Repository Structure

```text
.
|-- backend
|   |-- app
|   |   |-- database.py
|   |   |-- main.py
|   |   |-- models.py
|   |   |-- schemas.py
|   |   `-- routers
|   |       |-- attendance.py
|   |       |-- dashboard.py
|   |       `-- employees.py
|   |-- requirements.txt
|   |-- Procfile
|   `-- .env.example
|-- frontend
|   |-- src
|   |   |-- components
|   |   |-- api.ts
|   |   |-- App.tsx
|   |   |-- styles.css
|   |   `-- types.ts
|   |-- package.json
|   `-- .env.example
`-- README.md
```

## API Endpoints

- `GET /api/health`
- `POST /api/employees`
- `GET /api/employees`
- `DELETE /api/employees/{employee_id}`
- `POST /api/attendance`
- `GET /api/attendance?employee_id={id}&date={YYYY-MM-DD}`
- `GET /api/attendance/employee/{employee_id}`
- `GET /api/dashboard/summary`

## API Testing (Swagger)

FastAPI provides interactive API docs automatically.

Local (when backend runs on port 8000):

- Health check: `http://127.0.0.1:8000/api/health`
- Swagger UI: `http://127.0.0.1:8000/docs`

Deployed backend:

- Health check: `https://backend-six-psi-29.vercel.app/api/health`
- Swagger UI: `https://backend-six-psi-29.vercel.app/docs`

## Validation and Error Handling

- Required field validation
- Email format validation
- Duplicate employee ID/email prevention
- Duplicate attendance prevention per employee/date
- Graceful API errors with meaningful messages
- Proper HTTP status codes (`201`, `204`, `404`, `409`, `422`, `500`)

## Run Locally

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
# Windows PowerShell
Copy-Item .env.example .env
# macOS/Linux
# cp .env.example .env
uvicorn app.main:app --reload
```

Backend default URL: `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
# Windows PowerShell
Copy-Item .env.example .env
# macOS/Linux
# cp .env.example .env
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Deployment Steps

### Backend (Vercel + Neon)

1. Deploy `backend` directory to Vercel.
2. Add Neon integration and provision a Postgres resource.
3. Connect resource to backend project so `DATABASE_URL` is injected automatically.
4. Set `CORS_ORIGINS` to frontend deployed URL.
5. Redeploy backend.

### Frontend (Vercel)

1. Import repo, root directory `frontend`.
2. Add env variable `VITE_API_BASE_URL` pointing to deployed backend URL.
3. Deploy and verify all routes/flows.

## Assumptions and Limitations

- Single admin user; authentication is intentionally out of scope.
- Leave, payroll, and advanced HR modules are intentionally excluded.
- DB migrations are not included for speed; schema is auto-created on app startup.

## Evaluation Readiness Checklist

- [ ] Frontend deployed and publicly accessible
- [ ] Backend deployed and publicly accessible
- [ ] Frontend connected to live backend
- [ ] All required flows working end-to-end
- [ ] README submission links updated
- [ ] Repository public or access-enabled

