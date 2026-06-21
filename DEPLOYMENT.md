# Deployment Guide

This deploys the **backend** (Express API) to **Render** and the **frontend**
(React/Vite) to **Vercel**, using **MongoDB Atlas** for the database. All three
have free tiers.

> Order matters: deploy the **backend first**, then the **frontend**, then come
> back and link the two URLs together.

---

## 0. Prerequisites
- A **MongoDB Atlas** cluster + connection string (already set up ✅)
- A **GitHub** account with this project pushed to a repo
- Accounts on **Render** (render.com) and **Vercel** (vercel.com) — sign in with GitHub

This is a single repo with two apps:
```
polyclinic/
├── backend/    → deploy to Render (Root Directory: backend)
└── frontend/   → deploy to Vercel  (Root Directory: frontend)
```

---

## 1. Push to GitHub
From the `polyclinic/` folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
`.env` files are gitignored, so your secrets are NOT pushed. Good.

---

## 2. Deploy the backend (Render)
1. Render dashboard → **New** → **Web Service** → connect your GitHub repo.
2. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Add **Environment Variables** (Advanced → Add Environment Variable):

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | your Atlas connection string (`...mongodb.net/polyclinic?...`) |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_ORIGIN` | leave as `http://localhost:5173` for now (update in step 4) |
   | `LLM_ENDPOINT` | `https://menu.soyagora.com/api/v4/llm/stream` |
   | `LLM_TOKEN` | your LLM token |
   | `SEED_ADMIN_EMAIL` | your admin email |
   | `SEED_ADMIN_PASSWORD` | a strong admin password |

   > Do **not** set `PORT` — Render injects it automatically.
4. **Create Web Service**. Wait for the build to finish.
5. On first boot, if the database is empty it **auto-seeds** demo data.
   - To force a fresh reseed later, run `npm run seed` (Render Shell), or just
     let the auto-seed run on an empty DB.
6. Copy your backend URL, e.g. `https://polyclinic-api.onrender.com`.
7. Verify: open `https://<your-backend>/api/health` → should return `{"status":"ok",...}`.

> ⚠️ Atlas Network Access must allow `0.0.0.0/0` (you already set this) so Render
> can connect.

---

## 3. Deploy the frontend (Vercel)
1. Vercel dashboard → **Add New** → **Project** → import your GitHub repo.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
3. Add **Environment Variable**:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<your-backend>.onrender.com/api` |

4. **Deploy**. Copy your frontend URL, e.g. `https://polyclinic.vercel.app`.
   - SPA routing is already handled by `vercel.json` (no 404 on refresh).

---

## 4. Link the two together (CORS)
1. Back in **Render** → your service → **Environment** → edit `CLIENT_ORIGIN` to
   include your Vercel URL (comma-separated, keep localhost if you like):
   ```
   CLIENT_ORIGIN = https://polyclinic.vercel.app
   ```
2. Save → Render redeploys automatically.

That's it — open your Vercel URL and log in.

---

## 5. Post-deploy checklist
- [ ] `https://<backend>/api/health` returns ok
- [ ] Landing page loads, doctors + reviews show (backend reachable)
- [ ] Login works (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- [ ] Booking, notifications and AI features work
- [ ] No CORS errors in the browser console (means `CLIENT_ORIGIN` is correct)

## Demo credentials (from the seed)
| Role | Email | Password |
| --- | --- | --- |
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Doctor | `arjun@clinic.com` | `Doctor@123` |
| Patient | `rahul@example.com` | `Patient@123` |

> Change the doctor/patient demo passwords in `backend/src/seed.ts` before a
> public launch if you don't want well-known credentials.

---

## Notes & gotchas
- **Render free tier sleeps** after ~15 min of inactivity; the first request
  after sleeping takes ~30–50s to wake. Fine for demos.
- **AI rate limits:** 30 requests / 10 min per IP on `/api/ai/*`, 600 / 15 min
  globally. Adjust in `backend/src/middleware/rateLimit.ts`.
- **Security headers** via `helmet`; **CORS** restricted to `CLIENT_ORIGIN`.
- The in-memory dev database only runs when `MONGODB_URI` is empty — never the
  case in production.
