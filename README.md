# Polyclinic — Appointment & Management System

A full-stack web application that digitizes the operations of a multi-specialty
polyclinic. Three roles — **Admin**, **Doctor**, and **Patient** — share one
platform for appointment booking, consultation billing, prescriptions, and
operational analytics.

> Architecturally this mirrors the core patterns of a modern community /
> ecosystem-management platform: **role-based access control**, a **billing
> engine**, a **status-driven request workflow**, and an **analytics dashboard**
> — applied here to the healthcare domain.

---

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router 7, Recharts, Axios |
| Backend   | Node.js, Express 4, TypeScript, Mongoose 8                        |
| Database  | MongoDB (in-memory by default for zero-config dev; Atlas/local ready) |
| Auth      | JWT (Bearer tokens) + bcrypt, role-based middleware               |
| Validation| Zod schemas on every write endpoint                              |

---

## Features

- **Multi-role authentication & RBAC** — Admin / Doctor / Patient, enforced on every route.
- **Doctor & slot management** — doctors define weekly availability slots.
- **Appointment lifecycle** — `Requested → Confirmed → Completed / Cancelled`.
- **Slot-conflict engine** — a doctor can never be double-booked for the same
  slot on the same date. Enforced at the **database level** with a MongoDB
  *partial unique index* on `(doctor, slot, date)` where `active = true`; a
  concurrent duplicate raises `E11000`, mapped to HTTP `409`. Cancelling an
  appointment frees the slot for re-booking.
- **Auto-generated consultation bills** on completion, with a unique invoice
  number; patients can pay (mock payment) and view invoices.
- **Prescriptions** — doctors attach notes + medicines to completed visits;
  patients can view them.
- **Announcements / notices** — admin posts, everyone reads.
- **Admin analytics dashboard** — patient/doctor/appointment counts, revenue &
  pending dues, status breakdown (pie), top specialties (bar), recent activity.

---

## Project Structure

```
polyclinic/
├── backend/
│   ├── src/
│   │   ├── config/        # env, db connection, constants
│   │   ├── models/        # Mongoose schemas
│   │   ├── middleware/    # auth (JWT+RBAC), validation, error handling
│   │   ├── routes/        # auth, doctors, slots, appointments, bills, prescriptions, announcements, dashboard
│   │   ├── utils/         # jwt, password, ApiError, asyncHandler
│   │   ├── validation/    # Zod schemas
│   │   ├── seed.ts        # demo data + auto-seed
│   │   ├── app.ts         # Express app
│   │   └── server.ts      # entry point
│   └── scripts/test-e2e.mjs  # end-to-end API test (21 checks)
└── frontend/
    └── src/
        ├── api/           # axios client + TypeScript types
        ├── context/       # AuthContext
        ├── components/    # Layout, ProtectedRoute, StatusBadge, Spinner
        ├── lib/           # formatting helpers
        └── pages/         # login/register + patient / doctor / admin pages
```

---

## Running Locally

You need **Node.js 18+**. No database installation required — by default the
backend spins up an in-memory MongoDB and seeds demo data automatically.

### 1. Backend

```bash
cd backend
npm install
npm run dev        # http://localhost:4000  (auto-seeds demo data on first boot)
```

### 2. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Open **http://localhost:5173** and sign in with a demo account below
(the login screen has one-click buttons to fill them).

---

## Demo Credentials

| Role    | Email               | Password     |
| ------- | ------------------- | ------------ |
| Admin   | admin@clinic.com    | `Admin@123`  |
| Doctor  | arjun@clinic.com    | `Doctor@123` |
| Patient | rahul@example.com   | `Patient@123`|

Other doctors: `priya@clinic.com`, `rohit@clinic.com`, `sneha@clinic.com`
(all `Doctor@123`). Other patients: `anjali@example.com`, `karan@example.com`
(all `Patient@123`). New patients can self-register from the UI.

---

## Using a Real MongoDB (optional)

The in-memory DB resets on every restart. To persist data, point at a real
MongoDB and reseed:

1. Set `MONGODB_URI` in `backend/.env`, e.g.
   - Local: `mongodb://127.0.0.1:27017/polyclinic`
   - Atlas: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/polyclinic`
2. Seed once: `npm run seed` (wipes & repopulates).
3. `npm run dev`.

---

## API Overview

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

| Method | Endpoint                              | Role            | Purpose                          |
| ------ | ------------------------------------- | --------------- | -------------------------------- |
| POST   | `/auth/register`                      | public          | Patient (or doctor) signup       |
| POST   | `/auth/login`                         | public          | Login, returns JWT               |
| GET    | `/auth/me`                            | any             | Current user + doctor profile    |
| GET    | `/doctors`                            | any             | List/search doctors              |
| POST   | `/doctors`                            | admin           | Create a doctor                  |
| GET    | `/slots/doctor/:id`                   | any             | A doctor's bookable slots        |
| POST   | `/slots`                              | doctor          | Add a slot                       |
| POST   | `/appointments`                       | patient         | Book (slot-conflict enforced)    |
| GET    | `/appointments/mine` `/doctor` `/`    | patient/doc/adm | List appointments by role        |
| PATCH  | `/appointments/:id/status`            | role-based      | Move through lifecycle           |
| GET    | `/bills/mine`                         | patient         | Patient invoices                 |
| PATCH  | `/bills/:id/pay`                      | patient/admin   | Pay an invoice                   |
| POST   | `/prescriptions/appointment/:id`      | doctor          | Add/update prescription          |
| GET/POST/DELETE | `/announcements`             | any / admin     | Notices                          |
| GET    | `/dashboard`                          | admin           | Analytics                        |

---

## Testing

With the backend running on a fresh database:

```bash
cd backend
node scripts/test-e2e.mjs
```

Covers auth, the slot-conflict engine (booking / 409 duplicate / 400 wrong
weekday), the appointment lifecycle, auto-billing, prescriptions,
cancel-and-rebook, payments, the admin dashboard, and RBAC — **21 checks**.
