# Centour.ai

Centour.ai is an AI-powered study assistant. Users organize their work into
**Studies → Topics → Chats → Messages**, and chat with an LLM (Google Gemini)
for help on each topic.

## Project structure

| Folder | Stack | Purpose |
| --- | --- | --- |
| [`centour-frontend`](centour-frontend) | React 19 + Vite + Tailwind CSS | Web UI (auth, dashboard, sidebar, chat) |
| [`centour-backend`](centour-backend) | Flask + SQLAlchemy + PostgreSQL | REST API: auth, studies/topics/chats, LLM integration |
| [`centour-spring-boot`](centour-spring-boot) | Spring Boot (Java 17) | Backend rewrite/migration target (auth, JWT, Gemini, PostgreSQL) |

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, Axios, React Markdown
- **Backend (Flask)**: Flask, Flask-JWT-Extended, Flask-SQLAlchemy, PostgreSQL (psycopg2), Argon2 password hashing, Google GenAI (Gemini)
- **Backend (Spring Boot)**: Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, JJWT, BouncyCastle (Argon2, compatible with the Flask password hashes), Google GenAI

## Getting started

### Backend (Flask)

```powershell
cd centour-backend
python -m venv venv
./venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

Requires a `.env` with `JWT_SECRET_KEY`, `POSTGRESQL_URI`, and `GEMINI_API_KEY`.
The API runs at `http://localhost:5000`.

### Frontend (React + Vite)

```powershell
cd centour-frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` (the URL allowed by the backend's CORS config).

### Spring Boot backend

```powershell
cd centour-spring-boot
./mvnw spring-boot:run
```

### Run everything at once

`centour_dev.ps1` (in the repo root) launches the Flask backend and the React frontend together.
