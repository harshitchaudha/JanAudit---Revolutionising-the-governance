"""
JanAudit — FastAPI Backend Entry Point.
AI-Powered RTI & Government Transparency System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from database import engine, Base, get_db, SessionLocal
from models import Document, FinancialRecord, Anomaly, RTIDraft
from schemas import DashboardStats
from routers import documents, anomalies, rti

# Create all database tables
# This ensures the ORM models are materialized in the database

Base.metadata.create_all(bind=engine)

# FastAPI application setup
app = FastAPI(
    title="JanAudit API",
    description="AI-Powered RTI & Government Transparency System",
    version="1.0.0"
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router)
app.include_router(anomalies.router)
app.include_router(rti.router)


@app.get("/")
def root():
    return {
        "name": "JanAudit API",
        "version": "1.0.0",
        "description": "AI-Powered RTI & Government Transparency System"
    }


@app.get("/api/dashboard/stats", response_model=DashboardStats)
def dashboard_stats():
    """Get aggregate dashboard statistics."""
    db = SessionLocal()
    try:
        docs_processed = db.query(Document).filter(Document.status == "completed").count()
        total_expenditure = db.query(func.sum(FinancialRecord.amount)).scalar() or 0.0
        anomalies_count = db.query(Anomaly).count()
        drafts_count = db.query(RTIDraft).count()

        return DashboardStats(
            documentsProcessed=docs_processed,
            totalExpenditure=total_expenditure,
            anomaliesDetected=anomalies_count,
            rtiDraftsGenerated=drafts_count
        )
    finally:
        db.close()


@app.get("/api/charts/spending-by-category")
def spending_by_category():
    """Get spending aggregated by category for chart visualization."""
    db = SessionLocal()
    try:
        results = (
            db.query(FinancialRecord.category, func.sum(FinancialRecord.amount))
            .group_by(FinancialRecord.category)
            .all()
        )
        return {
            "labels": [r[0] or "Uncategorized" for r in results],
            "values": [float(r[1]) for r in results]
        }
    finally:
        db.close()


@app.get("/api/charts/spending-by-department")
def spending_by_department():
    """Get spending aggregated by department for chart visualization."""
    db = SessionLocal()
    try:
        results = (
            db.query(Document.sourceDepartment, func.sum(FinancialRecord.amount))
            .join(FinancialRecord, FinancialRecord.documentId == Document.id)
            .group_by(Document.sourceDepartment)
            .all()
        )
        return {
            "labels": [r[0] or "Unknown" for r in results],
            "values": [float(r[1]) for r in results]
        }
    finally:
        db.close()
