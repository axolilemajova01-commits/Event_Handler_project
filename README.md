# TUT Event Handler

A focused campus event platform for Tshwane University of Technology students, organizers, and administrators.

## What It Solves

Campus event information is often scattered across WhatsApp groups, which means students miss events when messages get buried or they are not in the right group. TUT Event Handler centralizes official TUT events and gives recognized organizers a faster way to publish high-quality event listings.

## Core Roles

- Students browse, search, filter, save, register for events, and receive reminders.
- Organizers create events, upload posters, manage registrations, close registrations, and view attendance.
- Admins approve organizers, manage users, campuses, faculties, and view platform statistics.

## Main AI Feature

Organizers can describe an event in plain English. The backend sends that prompt to an LLM and returns structured event content:

- Title
- Professional description
- Category
- Tags
- Target audience
- Summary
- Objectives
- What attendees should bring
- Estimated duration
- Search keywords

The organizer reviews and edits the result before publishing.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: Spring Boot 3.5, Spring Security, JWT
- Database: PostgreSQL
- Storage: Cloudinary
- Email: JavaMail
- AI: OpenAI-compatible chat completion endpoint

## Project Structure

```text
tut-event-handler/
  frontend/  React + Tailwind user interface
  backend/   Spring Boot REST API foundation
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Backend Setup

The backend uses an in-memory H2 database by default so you can run it before setting up PostgreSQL.

Optional environment variables:

```bash
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=your_openai_key
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Run the API:

```bash
cd backend
mvn spring-boot:run
```

The backend defaults to `http://localhost:8080`.

The H2 console is available at `http://localhost:8080/h2-console` using:

```text
JDBC URL: jdbc:h2:mem:tut_event_handler
User: sa
Password:
```

When you are ready for PostgreSQL, create a database named `tut_event_handler`, set `DB_USERNAME` and `DB_PASSWORD`, then run:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```
