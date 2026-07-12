# TUT Event Handler - Deployment Guide

## What You Need Before Starting

- ✅ GitHub account (already set up)
- ✅ Render account (already set up - https://render.com)
- ✅ Vercel account (already set up - https://vercel.com)
- ✅ Your Gemini API key: `AQ.Ab8RN6K7Y8EJ-Q0Y1SoTRFzTR4ZdMPmkxfaU1DcYlDLfoXwLBw`
- ✅ Your OpenAI API key: `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`

## AI & Email Questions Answered

### Does Ollama work on Render?
**No.** Ollama runs on your local machine only. On Render's server:
- If you provide a **Gemini API key** → AI draft generation uses Google Gemini
- If you provide an **OpenAI API key** → AI draft generation uses OpenAI
- If you **don't** provide any key → AI draft uses a built-in template (still works!)

### Does email work on Render?
**Not by default.** Email sending needs Gmail credentials configured. 
- If you don't set MAIL_USERNAME/MAIL_PASSWORD → forgot password works in the UI anyway
- The app returns a clickable reset link directly on screen

---

## STEP 1: Push Your Code to GitHub

Open a terminal in the project folder and run these commands one by one:

```bash
# 1. Add all files
git add .

# 2. Commit with a message
git commit -m "Ready for deployment with Render + Vercel"

# 3. Push to GitHub
git push origin main
```

Wait for the push to finish. Now your code is on GitHub.

---

## STEP 2: Deploy Backend to Render

### 2a. Create PostgreSQL Database

1. Go to **https://dashboard.render.com**
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: `tut-event-db`
   - **Database**: `tut_events`
   - **User**: `tut_user`
   - **Plan**: **Free** (scroll down - "Free" is $0/month)
4. Click **"Create Database"**
5. Wait 2-3 minutes for it to be ready
6. **IMPORTANT**: Copy these values from the database info page (you'll need them):
   ```
   Hostname (e.g., dpg-d99eeul7vvec73ffs530-a.render.com)
   Port (usually 5432)
   Database (tut_events)
   Username (tut_user)
   Password (K41w9kG8jkHYZQCSVDRyNzxe5QFHMW93)
   ```

### 2b. Create Web Service

1. Still on Render dashboard, click **"New +"** → **"Web Service"**
2. Under "Connect a repository", click **"Connect"** next to your GitHub repo
3. If it asks for permissions, grant access
4. Fill in the details:
   - **Name**: `tut-event-handler-api`
   - **Runtime**: **Java** (select from dropdown)
   - **Branch**: `main`
   - **Region**: Choose **Frankfurt (EU)** (closest to South Africa)
   - **Plan**: **Free**
5. Click **"Advanced"** (the button, not Create Web Service)

### 2c. Add Environment Variables

In the "Environment Variables" section, add these **one by one**:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8081` |
| `DB_HOST` | (Hostname from step 2a) |
| `DB_PORT` | `5432` |
| `DB_NAME` | `tut_events` |
| `DB_USERNAME` | (Username from step 2a) |
| `DB_PASSWORD` | (Password from step 2a) |
| `JWT_SECRET` | Click **"Generate Value"** |
| `GEMINI_API_KEY` | `AQ.Ab8RN6K7Y8EJ-Q0Y1SoTRFzTR4ZdMPmkxfaU1DcYlDLfoXwLBw` |
| `OPENAI_API_KEY` | `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` |
| `VERCEL_DOMAIN` | `tut-event-handler.vercel.app` (add this after Vercel) |

**Optional** (skip these if you don't have them):
| `MAIL_USERNAME` | your-email@gmail.com |
| `MAIL_PASSWORD` | Gmail app password |
| `CLOUDINARY_CLOUD_NAME` | (for poster uploads) |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |

### 2d. Create the Service

1. Under Build and Deploy, make sure:
   - **Build Command**: `cd backend && mvn clean package -DskipTests`
   - **Start Command**: `java -jar backend/target/eventhandler-0.0.1-SNAPSHOT.jar`
2. Click **"Create Web Service"**
3. **Wait 5-10 minutes** for the build. You'll see a live log of:
   - Maven downloading dependencies
   - Java compiling
   - Spring Boot starting up
4. When done, you'll see: **"Your service is live 🎉"**
5. Copy your backend URL. It looks like:
   ```
   https://tut-event-handler-api.onrender.com
   ```

### 2e. Test the Backend

Open a new browser tab and paste `https://tut-event-handler-api.onrender.com` - you should see a response.

---

## STEP 3: Deploy Frontend to Vercel

### 3a. Start Deployment

1. Go to **https://vercel.com**
2. Click **"Add New…"** → **"Project"**
3. Click **"Import Git Repository"** and find your GitHub repo
4. If it asks, grant Vercel access to your GitHub

### 3b. Configure Project

1. **Root Directory**: Click "Edit" → Select **`frontend`** from the dropdown
2. **Framework Preset**: Should auto-detect "Vite"
3. **Build Command**: `npm run build` (should be auto-filled)
4. **Output Directory**: `dist` (should be auto-filled)

### 3c. Add Environment Variable

Click **"Environment Variables"** → Add:
```
VITE_API_BASE_URL=https://tut-event-handler-api.onrender.com
```
(Use your actual backend URL from Step 2d)

### 3d. Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes
3. When done, you'll see: **"Congratulations, your project is deployed! 🎉"**
4. Your frontend URL:
   ```
   https://tut-event-handler.vercel.app
   ```

### 3e. Update CORS on Backend

Now that Vercel gave you a URL:

1. Go back to **Render dashboard** → your web service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add: `VERCEL_DOMAIN` = `tut-event-handler.vercel.app`
5. Click **"Save Changes"**
6. The service will automatically redeploy (wait 2-3 minutes)

---

## STEP 4: Test Everything

### Open Your Live Site

1. Go to **https://tut-event-handler.vercel.app** (or whatever Vercel gave you)
2. The login page should load

### Test Registration

1. Click "Register"
2. Enter:
   - Full name: `Admin User`
   - Student number: `000000000`
   - Role: select **Event Organizer**
   - Email: `admin@tut.ac.za`
   - Password: `admin123`
3. Click "Create account"
4. ✅ You should be logged in

### Test Forgot Password

1. Sign out
2. Click "Forgot password?"
3. Enter: `admin@tut.ac.za`
4. ✅ You should see the screen to enter a new password
5. Enter a new password and reset it
6. Log in with the new password

### Test AI Event Draft

1. Log in as an organizer
2. Click "Generate draft"
3. ✅ Should generate an event using Google Gemini or OpenAI

---

## STEP 5: Create the First Admin User

To access the admin dashboard:

1. Register a new user with email `admin@tut.ac.za` and role **Event Organizer**
2. Go to **Render dashboard** → your database
3. Click **"Connect"** → copy the PSQL command
4. Paste it in your terminal and run:
   ```sql
   UPDATE users SET role = 'ADMIN', approved = true WHERE email = 'admin@tut.ac.za';
   ```
5. Log out and log back in → you'll see the Admin dashboard

---

## Quick Reference: Environment Variables

### Backend (Render)
```
SPRING_PROFILES_ACTIVE=prod          # Required
PORT=8081                            # Required
DB_HOST=xxx                          # From Render PostgreSQL
DB_PORT=5432                         # From Render PostgreSQL
DB_NAME=tut_events                   # From Render PostgreSQL
DB_USERNAME=xxx                      # From Render PostgreSQL
DB_PASSWORD=xxx                      # From Render PostgreSQL
JWT_SECRET=xxx                       # Click "Generate Value"
GEMINI_API_KEY=xxx                   # Your Gemini API key
OPENAI_API_KEY=xxx                   # Your OpenAI API key
VERCEL_DOMAIN=xxx.vercel.app         # Your Vercel URL
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://tut-event-handler-api.onrender.com
```

---

## Troubleshooting

### "Application Error" on Render
- Wait 2 minutes after build finishes
- Check "Logs" tab for error details
- Make sure all DB environment variables are set correctly

### Frontend shows blank page
- Open browser DevTools (F12) → Console tab
- Look for errors
- Most common: `VITE_API_BASE_URL` is wrong

### CORS errors in browser
- Make sure `VERCEL_DOMAIN` env variable is set correctly on Render
- Redeploy the backend after adding it

### AI draft not working
- Check that `GEMINI_API_KEY` or `OPENAI_API_KEY` is set correctly on Render
- Check Render logs for error messages

### Slow first load (free plan)
- Render Free plan sleeps after 15 minutes of no use
- The first request takes ~30 seconds to wake up
- After that it's fast

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Free | $0/month |
| Render PostgreSQL | Free (first 90 days) | $0 → $7/month after |
| Vercel | Free | $0/month |
| **Total** | | **$0 for 3 months, then $7/month** |

---

## Done! 🎉

Your TUT Event Handler is now live on the internet. To make changes:

1. Edit code in Visual Studio Code
2. `git add . && git commit -m "description" && git push`
3. Both Render and Vercel automatically redeploy