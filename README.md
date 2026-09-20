# NyaySahayak

NyaySahayak is a legal assistance platform for Indian legal workflows. It combines a React frontend with a FastAPI backend for case workspaces, document parsing, citation verification, and case graph generation.

## Features

- AI-style legal assistance interface for citizens and legal professionals
- Case workspace creation and document upload APIs
- PDF/DOCX parsing with page-level provenance
- Citation verification against configured legal corpus sources
- Case graph, timeline, fact, and evidence mapping services
- Multilingual and script-detection utilities for Indian-language documents

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: SQLite by default for local development
- Parsing: PyMuPDF, python-docx
- Tests: pytest

## Project Structure

```text
NyaySahayak/
  backend/
    app/
      api/          FastAPI route modules
      core/         Security and corpus configuration
      db/           SQLAlchemy database setup and models
      schemas/      Pydantic schemas
      services/     Parser, verification, and case graph services
    tests/          Backend tests
    requirements.txt
  frontend/
    src/            React application source
    package.json
  requirements.txt
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Backend Setup

From the project root:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

Backend URLs:

```text
API root: http://127.0.0.1:8000/
Health:   http://127.0.0.1:8000/health
Docs:     http://127.0.0.1:8000/docs
```

The backend uses SQLite by default and creates `nyaysahayak.db` automatically. To use another database, set `DATABASE_URL`.

## Frontend Setup

Open a second terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000/
```

The frontend dev server proxies `/api` requests to:

```text
http://127.0.0.1:8000
```

## Running Tests

From the project root:

```powershell
.\venv\Scripts\activate
cd backend
python -m pytest tests
```

## Useful Commands

Backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm run dev
```

Frontend production build:

```powershell
cd frontend
npm run build
```

## Notes

- Run the backend and frontend in separate terminals during development.
- If `/` returns a backend JSON message, the backend is running correctly.
- If the frontend cannot reach APIs, confirm the backend is running on port `8000`.
- Generated local files such as virtual environments, Node modules, build output, and SQLite databases should not be committed.
