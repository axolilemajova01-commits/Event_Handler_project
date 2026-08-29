# Reviving the Render Database (Free Tier Expiry)

Render's **free PostgreSQL plan expires 90 days after creation** — the database is
deleted, not paused. When that happens the Spring Boot API can't open a connection,
fails to boot, and every request to the API dies (timeouts / 502s).

This guide spins up a fresh database and re-wires the API to it. No code changes
are needed — only the five `DB_*` environment variables.

---

## Step 1 — Create the new database

1. Go to **https://dashboard.render.com**
2. **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `tut-event-db-2` (any name works)
   - **Database**: `tut_events`
   - **User**: `tut_user`
   - **Plan**: **Free** (scroll down — $0/month)
4. **Region: pick the same region as your API service** (Frankfurt EU per DEPLOYMENT.md) — keeps latency low
5. Click **Create Database** and wait 2–3 minutes for it to be ready

---

## Step 2 — Copy the new credentials

Open the new database → **Info** page. From the **External** section, note:

- **Hostname** (e.g. `dpg-xxxxx-a.render.com`)
- **Port** (`5432`)
- **Database** (`tut_events`)
- **Username** (`tut_user`)
- **Password**

---

## Step 3 — Point the API service at the new database

1. Render dashboard → your **API service** (`tut-event-handler-api`) → **Environment** tab
2. Replace the values of these five variables:

   ```
   DB_HOST=<external hostname>
   DB_PORT=5432
   DB_NAME=tut_events
   DB_USERNAME=tut_user
   DB_PASSWORD=<new password>
   ```

3. Click **Save Changes** — Render redeploys automatically

---

## Step 4 — Watch the first boot (it does the heavy lifting)

Nothing to run manually. On startup against the empty database:

- `ddl-auto: update` (prod profile) → Hibernate **creates all tables**
  (`users`, `events`, `campuses`, `faculties`, ...)
- `DataSeeder` (CommandLineRunner) → sees the empty tables and
  **reseeds the campuses and faculties**

Check the **Logs** tab: you want Tomcat starting cleanly with no
`Connection refused` / `password authentication failed` errors.

---

## Step 5 — Re-create the first admin (chicken-and-egg fix)

`/register` only creates students/organizers, and creating staff accounts
requires an existing admin — so promote one manually:

1. Register a normal account through the app first (so the row exists)
2. New database page → **Connect** → copy the external **PSQL command** → run it in your terminal
3. Promote the user:

   ```sql
   UPDATE users SET role = 'ADMIN', approved = true WHERE email = 'admin@tut.ac.za';
   ```

   `role` is stored as a string — `'ADMIN'` must match the `UserRole` enum
   constant exactly (case-sensitive).

---

## Step 6 — Verify

- Load the app → the **campus/faculty dropdowns are populated** (proves the seeder ran)
- Log in with the promoted admin → the **Admin dashboard** loads
- Create a test event to confirm writes work

---

## Before the next expiry: back up

The 90-day clock starts **at creation**, not at last use. Two things to do:

1. **Calendar reminder around day 85** to re-run this guide. The data is gone
   after expiry — Render deletes the instance, it does not archive it.
2. **Grab a portable backup** any time before then:

   ```bash
   pg_dump "postgresql://tut_user:<password>@<hostname>/tut_events?sslmode=require" -Fc -f tut_events_backup.dump
   ```

   Restore into a fresh database with:

   ```bash
   pg_restore -d "postgresql://tut_user:<password>@<new-hostname>/tut_events?sslmode=require" --no-owner tut_events_backup.dump
   ```

---

## Alternative: free Postgres hosts that don't expire

If the 90-day cycle gets old, these free tiers don't delete your database
(policies as of writing — double-check before committing):

| Host | Free tier behaviour |
|------|--------------------|
| **Neon** (neon.tech) | Free Postgres, projects persist — no 90-day deletion |
| **Supabase** | Free projects **pause after ~1 week of inactivity** (one-click restore from the dashboard), but aren't deleted |
| **Aiven** | One free Postgres service, doesn't expire |

They're all plain Postgres: create a database, copy its host / port / db /
user / password into the same five `DB_*` variables on Render, and redeploy.
`ddl-auto: update` + `DataSeeder` mean an empty database rebuilds itself
exactly as in Step 4.