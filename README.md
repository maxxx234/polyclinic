<div align="center">

# 🏥 Polyclinic — Appointment & Management System

**A full-stack, AI-powered platform that digitizes the operations of a modern multi-specialty clinic.**

Patients, doctors, and admins each get a tailored portal — built around online booking, a conflict-free scheduling engine, billing, prescriptions, real-time notifications, and four AI features powered by an LLM.

[Tech Stack](#-tech-stack) · [Features](#-features) · [AI Features](#-ai-features) · [Run Locally](#-run-locally) · [Deployment](#-deployment) · [API](#-api-overview)

</div>

---

## 📖 Overview

Polyclinic is a production-style **MERN-stack** application (MongoDB, Express, React, Node) written end-to-end in **TypeScript**. It serves three roles from one platform:

- **Patients** — browse doctors, get AI symptom guidance, book appointments, view bills & prescriptions, leave reviews, and chat with an AI assistant.
- **Doctors** — manage availability slots, confirm/complete appointments, and write digital prescriptions.
- **Admins** — run an analytics dashboard with AI insights, manage doctors, track patient records for follow-ups, and post announcements.

It also has a **public marketing landing page** (image slider, specialities, doctor showcase, testimonials, FAQ, contact) so visitors can explore and book before signing up.

> The architecture mirrors a modern community/ecosystem-management platform: **role-based access control**, a **billing engine**, a **status-driven request workflow**, and an **analytics dashboard** — applied here to the healthcare domain.

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router 7, Recharts, lucide-react, react-hot-toast, Axios |
| **Backend** | Node.js, Express 4, TypeScript, Mongoose 8 |
| **Database** | MongoDB (Atlas in production; zero-config in-memory for local dev) |
| **Auth** | JWT (Bearer) + bcrypt, role-based middleware |
| **AI** | LLM via REST (server-side only) — symptom triage, chatbot, insights, tips |
| **Security** | Zod validation, Helmet, rate limiting (per-IP), CORS allow-list |

---

## ✨ Features

### 🔐 Authentication & access control
- JWT login/registration, bcrypt-hashed passwords, persistent sessions
- **Role-based access control** (Admin / Doctor / Patient) enforced on every route
- Patient registration captures **phone, age, and sex**
- Protected frontend routes + role-aware redirects

### 👤 Patient
- Personalized **Home** dashboard — greeting, mood check-in, AI wellness tip, health recommendations, stats, testimonials
- **Find a Doctor** — search/filter by specialty, view full profiles (photo, experience, qualifications, languages, fees)
- **Book appointments** with date/slot picker (weekday-validated)
- **My Appointments** — track status, cancel, view prescriptions
- **Bills** — auto-generated invoices, pay online (mock), dues summary
- **Patient Corner** — write & read reviews/testimonials
- **AI Symptom Checker** + **AI chatbot**

### 🩺 Doctor
- Manage weekly **availability slots** (add / enable-disable / delete)
- **Appointment lifecycle** — confirm, complete (auto-bills), cancel
- Write/edit **digital prescriptions**
- Filterable appointment views, notifications

### 🛠 Admin
- **Analytics dashboard** — KPIs, status pie chart, top-specialties bar chart, recent activity
- **AI Smart Insights** — an AI-written, data-driven summary + recommendations
- **Manage doctors** — create/remove (with experience, qualifications, languages)
- **Patient Records tracker** — visits, last visit, dues, and **follow-up status** to drive re-engagement
- **All appointments** view + **announcements**

### ⚙️ Core engineering
- **Slot-conflict engine** — a doctor can never be double-booked for the same slot/date, enforced at the **database level** via a MongoDB *partial unique index* (concurrent duplicate → `409`); cancelling frees the slot
- **Appointment state machine** — `Requested → Confirmed → Completed / Cancelled` with role-specific permissions
- **Automatic billing** on completion, with unique invoice numbers
- **Real-time notifications** — bell with red dot + per-tab badges (new request → doctor, confirmation → patient, reminders for both)
- **Live theme switcher** — 6 color themes applied app-wide via CSS variables
- Fully **responsive** (mobile drawer nav, adaptive grids, scrollable tables)

---

## 🤖 AI Features

All AI runs **server-side** (the LLM token never reaches the browser), with structured-JSON parsing, graceful fallbacks, and per-IP rate limiting.

1. **AI Symptom Checker** — describe symptoms (or tap from ~50 grouped chips) → the AI picks the right specialty from 15, estimates urgency, lists possible conditions, and recommends **real matching doctors** to book.
2. **Role-aware Chatbot ("Poly")** — a floating assistant on the landing page and in every portal that answers questions tailored to the user's role, using live clinic data.
3. **Patient wellness tips & recommendations** — AI tip-of-the-day plus rule-based health prompts (check-up reminders, age-based screenings).
4. **Smart Dashboard Insights** — feeds aggregated clinic metrics to the LLM for an admin-facing narrative + actionable recommendations.

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+ (no database install needed — a zero-config in-memory MongoDB starts automatically for local dev).

### 1. Backend
```bash
cd backend
npm install
npm run dev          # http://localhost:4000  (auto-seeds demo data)
```

### 2. Frontend (second terminal)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173** and sign in with a demo account (the login screen has one-click buttons).

### Using a real database (optional)
Set `MONGODB_URI` in `backend/.env` to a local MongoDB or **MongoDB Atlas** string, then `npm run seed` to populate it. See `backend/.env.example` for all variables.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@clinic.com` | `Admin@123` |
| **Doctor** | `arjun@clinic.com` | `Doctor@123` |
| **Patient** | `rahul@example.com` | `Patient@123` |

> 15 doctors across 15 specialties are seeded. Other doctors use `Doctor@123`; other patients use `Patient@123`. New patients can self-register.

---

## 🗂 Project Structure

```
polyclinic/
├── backend/
│   └── src/
│       ├── config/        # env, db connection, constants
│       ├── models/        # Mongoose schemas (User, Doctor, Slot, Appointment, Bill, …)
│       ├── middleware/     # auth, RBAC, validation, rate limiting, errors
│       ├── routes/        # auth, doctors, slots, appointments, bills, ai, admin, patient, …
│       ├── utils/         # jwt, password, notify, ApiError
│       ├── validation/    # Zod schemas
│       ├── seed.ts        # demo data + auto-seed
│       └── server.ts      # entry point
└── frontend/
    └── src/
        ├── api/           # axios client + TypeScript types
        ├── context/       # AuthContext
        ├── components/    # Layout, ChatBot, NotificationBell, ThemeSwitcher, ui/, landing/
        ├── hooks/         # useNavBadges
        ├── lib/           # formatting, themes, images, specialities
        └── pages/         # Landing + auth + patient / doctor / admin portals
```

---

## 🔌 API Overview

All routes are prefixed with `/api`; protected routes require `Authorization: Bearer <token>`.

| Area | Sample endpoints |
| --- | --- |
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **Doctors / Slots** | `GET /doctors`, `POST /doctors` (admin), `POST /slots` (doctor) |
| **Appointments** | `POST /appointments` (slot-conflict enforced), `PATCH /appointments/:id/status` |
| **Billing** | `GET /bills/mine`, `PATCH /bills/:id/pay` |
| **Prescriptions** | `POST /prescriptions/appointment/:id` |
| **Notifications** | `GET /notifications`, `PATCH /notifications/read-all` |
| **AI** | `POST /ai/symptom-check`, `POST /ai/chat`, `POST /ai/dashboard-insights`, `POST /ai/wellness-tip` |
| **Admin / Patient** | `GET /admin/patients`, `GET /patient/overview`, `GET /dashboard` |
| **Public (no auth)** | `GET /public/doctors`, `/specialties`, `/reviews`, `/stats` |

---

## ☁️ Deployment

The app is deploy-ready (env templates, SPA rewrites for Vercel/Netlify, Helmet, rate limiting, CORS allow-list). A full step-by-step guide — **Render** (backend) + **Vercel** (frontend) + **MongoDB Atlas** — is in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 🧪 Testing

With the backend running on a fresh database:
```bash
cd backend
node scripts/test-e2e.mjs       # 21 checks: auth, slot-conflict, lifecycle, billing, RBAC …
node scripts/test-notify.mjs    # notifications + registration validation
```

---

## 🌟 Highlights

- **Database-level concurrency safety** — the slot-conflict engine uses a MongoDB partial unique index, not just app-level checks.
- **AI done right** — token kept server-side, structured-JSON prompts, fallbacks, and rate limiting to control cost.
- **One platform, three tailored experiences** — clean RBAC across patient/doctor/admin.
- **Production hardening** — Helmet, per-IP rate limits, env-driven secrets, CORS allow-list, typed end-to-end.

<div align="center">

Built with ❤️ for modern, accessible healthcare.

</div>
