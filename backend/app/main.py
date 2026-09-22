import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import auth, cases, documents, verification, case_graph, simulation

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NyaySahayak API",
    description="Verified Multi-Agent AI System for Courtroom Preparation",
    version="0.3.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(verification.router)
app.include_router(case_graph.router)
app.include_router(simulation.router)

@app.get("/")
def root():
    return {
        "message": "NyaySahayak API is running",
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "NyaySahayak",
        "phase": "Phase 2 - Case Intelligence & Evaluation Dataset",
        "version": "0.2.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
