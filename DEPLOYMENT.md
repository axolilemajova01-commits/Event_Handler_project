# TUT Event Handler — Deployment Guide

Deployment instructions for the TUT Event Handler platform: a React + Vite frontend
hosted on Vercel, a Spring Boot API hosted on Render, and a managed PostgreSQL
database on Render.

| Component | Stack | Host |
|-----------|-------|------|
| Frontend | Vite + React + Tailwind | Vercel |
| Backend | Spring Boot 3.5 / Java 21 | Render (Web Service) |
| Database | PostgreSQL | Render (expires — see below) |

## Prerequisites

- GitHub repository containing this code
- [Render](https://render.com) account
- [Vercel](https://vercel.com) account
- Gemini and/or OpenAI API key (optional — see service behaviour below)
- Gmail app password (optional — only needed for outbound email)

## Service Behaviour Notes

### AI event drafting

Ollama does not run on Render's servers. The backend picks its AI provider from
the environment:

- `GEMINI_API_KEY` set → drafts are generated with Google Gemini
- `OPENAI_API_KEY` set → drafts are generated with OpenAI
- neither set → a deterministic built-in template is used, so the feature
  degrades in quality but never fails

### Email / forgot password

Outbound email requires `MAIL_USERNAME` and `MAIL_PASSWORD` (Gmail app password).
Without them the forgot-password flow still works: the API returns the reset
link directly in the response, and the UI renders it as a clickable link.

---

## Step 1 — Push the Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2 — Deploy the Backend to Render

### 2a. Create the PostgreSQL Database

1. Render dashboard → **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `event-handler-db` (any name)
   - **Database**: `tut_events`
   - **User**: `tut_user`
   - **Plan**: Free
   - **Region**: same as the API service (Frankfurt EU is closest to South Africa)
3. **Create Database** — ready in 2–3 minutes
4. From the **Info** page, record the **External** connection values:

   ```
   Hostname   dpg-xxxxxxxxxxxx-a.render.com
   Port       5432
   Database   tut_events
   Username   tut_user
   Password   (shown on the same page)
   ```

### 2b. Create the Web Service

1. Render dashboard → **New +** → **Web Service** → connect the GitHub repo
2. Settings:
   - **Name**: `event-handler-api` (any name)
   - **Runtime**: Java
   - **Branch**: `main`
   - **Region**: Frankfurt (EU)
   - **Plan**: Free
3. **Build Command**: `cd backend && mvn clean package -DskipTests`
4. **Start Command**: `java -jar backend/target/eventhandler-0.0.1-SNAPSHOT.jar`
5. Open **Advanced** → add the environment variables from 2c
6. **Create Web Service** — the first build takes 5–10 minutes

### 2c. Environment Variables

Required:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8081` |
| `DB_HOST` | hostname from step 2a |
| `DB_PORT` | `5432` |
| `DB_NAME` | `tut_events` |
| `DB_USERNAME` | username from step 2a |
| `DB_PASSWORD` | password from step 2a |
| `JWT_SECRET` | use Render's **Generate Value** button |
| `VERCEL_DOMAIN` | `<app-name>.vercel.app` (add after Step 3) |

AI providers (at least one recommended):

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | key from Google AI Studio |
| `OPENAI_API_KEY` | key from the OpenAI dashboard |

Optional:

| Variable | Value |
|----------|-------|
| `MAIL_USERNAME` | Gmail address |
| `MAIL_PASSWORD` | Gmail app password |
| `CLOUDINARY_CLOUD_NAME` | for poster uploads |
| `CLOUDINARY_API_KEY` | for poster uploads |
| `CLOUDINARY_API_SECRET` | for poster uploads |

> **Never commit real values of these variables to the repository.** They belong
> only in the Render Environment tab (and Vercel's equivalent for the frontend).

### 2d. Verify the Backend

Open `https://<service-name>.onrender.com` in a browser — the API root should
respond with JSON.

---

## Step 3 — Deploy the Frontend to Vercel

1. Vercel → **Add New…** → **Project** → import the GitHub repo
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite (auto-detected)
4. **Build Command**: `npm run build` · **Output Directory**: `dist`
5. Environment variable → **Add**:
   ```
   VITE_API_BASE_URL=https://<service-name>.onrender.com
   ```
   (the backend URL from Step 2d)
6. **Deploy** — ready in 1–2 minutes; note the resulting `<app-name>.vercel.app` URL

### Update CORS on the Backend

1. Render dashboard → the API service → **Environment** tab
2. Add `VERCEL_DOMAIN` = `<app-name>.vercel.app`
3. **Save Changes** — the service redeploys automatically (2–3 minutes)

---

## Step 4 — Verify the Deployment

1. Open the Vercel URL — the login page should load
2. Register a user with role **Event Organizer** → auto-login works
3. Sign out → **Forgot password?** → submit the email → a reset link is shown
   on screen (or emailed, if mail credentials are configured)
4. Log in as the organizer → **Generate draft** → an event draft is produced
   (Gemini, OpenAI, or the built-in template depending on configuration)

---

## Step 5 — Create the First Admin Account

`/register` only creates students/organizers, and creating staff accounts
requires an existing admin — so promote one manually:

1. Register a normal account (e.g. `admin@tut.ac.za`)
2. Render dashboard → the database → **Connect** → copy the external PSQL
   command and run it in a terminal
3. Promote the account:
   ```sql
   UPDATE users SET role = 'ADMIN', approved = true WHERE email = 'admin@tut.ac.za';
   ```
4. Log out and back in → the Admin dashboard is available

`role` is stored as a string — `'ADMIN'` must match the `UserRole` enum
constant exactly (case-sensitive).

---

## Environment Variable Reference

Backend (Render):

```
SPRING_PROFILES_ACTIVE=prod
PORT=8081
DB_HOST=xxx                          # from Render PostgreSQL
DB_PORT=5432
DB_NAME=tut_events
DB_USERNAME=xxx                      # from Render PostgreSQL
DB_PASSWORD=xxx                      # from Render PostgreSQL
JWT_SECRET=xxx                       # "Generate Value"
GEMINI_API_KEY=xxx                   # optional
OPENAI_API_KEY=xxx                   # optional
VERCEL_DOMAIN=xxx.vercel.app
MAIL_USERNAME=xxx                    # optional
MAIL_PASSWORD=xxx                    # optional
CLOUDINARY_CLOUD_NAME=xxx            # optional
CLOUDINARY_API_KEY=xxx               # optional
CLOUDINARY_API_SECRET=xxx            # optional
```

Frontend (Vercel):

```
VITE_API_BASE_URL=https://<backend-service>.onrender.com
```

---

## Database Expiry (Render Free Tier)

Render's free PostgreSQL is **deleted 90 days after creation** — the API then
cannot open a connection, fails to boot, and every request fails. The revival
procedure (fresh database + re-pointing the five `DB_*` variables) is in
**[RENDER_DB_REVIVAL.md](./RENDER_DB_REVIVAL.md)**.

Before expiry, capture a portable backup:

```bash
pg_dump "postgresql://<user>:<password>@<hostname>/tut_events?sslmode=require" -Fc -f backup.dump
```

---

## Troubleshooting

**"Application Error" on Render** — wait 2 minutes after the build finishes,
then check the **Logs** tab; usually a mistyped `DB_*` variable.

**Frontend shows a blank page** — open DevTools (F12) → Console; the most
common cause is a wrong `VITE_API_BASE_URL`.

**CORS errors in the browser** — ensure `VERCEL_DOMAIN` is set on the Render
service, then redeploy.

**AI drafts not generated** — check that `GEMINI_API_KEY` / `OPENAI_API_KEY`
are set and check the Render logs; without any key the built-in template is
used by design.

**Slow first request** — Render's free plan sleeps after 15 minutes idle; the
first request takes ~30 seconds to wake the service.

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Free | $0/month |
| Render PostgreSQL | Free (first 90 days) | $0 → $7/month after |
| Vercel | Free | $0/month |
| **Total** | | **$0 for 3 months, then $7/month** |

---

## Redeploying

Pushes to `main` trigger automatic redeploys on both Render and Vercel — no
manual steps required.