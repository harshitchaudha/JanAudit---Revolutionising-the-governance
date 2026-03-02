"""
Documents Router — Upload and document management endpoints.
"""

import os
import uuid
import shutil
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from models import Document, FinancialRecord, Anomaly
from schemas import DocumentResponse, DocumentDetailResponse
from agents.auditor import extract_financial_data
from agents.analyzer import detect_anomalies

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _process_document(document_id: str, file_path: str):
    """Background task to process an uploaded PDF."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        # Step 1: Auditor Agent — extract financial data
        try:
            result = extract_financial_data(file_path)
        except Exception as e:
            doc.status = "failed"
            db.commit()
            return

        # Update department
        doc.sourceDepartment = result.get("department", "Unknown")

        # Step 2: Store extracted records
        records_data = result.get("records", [])
        db_records = []
        for r in records_data:
            record = FinancialRecord(
                id=r.get("id", str(uuid.uuid4())),
                documentId=document_id,
                projectName=r.get("projectName", ""),
                category=r.get("category", ""),
                amount=r.get("amount", 0.0),
                transactionDate=datetime.fromisoformat(r["transactionDate"]) if r.get("transactionDate") else None
            )
            db.add(record)
            db_records.append(r)

        db.flush()

        # Step 3: Analyzer Agent — detect anomalies
        anomalies_data = detect_anomalies(db_records)
        for a in anomalies_data:
            anomaly = Anomaly(
                id=a.get("id", str(uuid.uuid4())),
                recordId=a.get("recordId", ""),
                anomalyType=a.get("anomalyType", ""),
                description=a.get("description", ""),
                confidenceScore=a.get("confidenceScore", 0.0)
            )
            db.add(anomaly)

        doc.status = "completed"
        db.commit()

    except Exception as e:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a PDF document for processing."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    # Save uploaded file
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create document record
    document = Document(
        id=doc_id,
        fileName=file.filename,
        status="processing"
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Trigger background processing
    background_tasks.add_task(_process_document, doc_id, file_path)

    return document


@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents."""
    return db.query(Document).order_by(Document.uploadDate.desc()).all()


@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    """Get a document with its extracted financial records."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc
