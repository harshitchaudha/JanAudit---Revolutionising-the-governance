"""
Documents Router — Upload, process & delete documents.
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


def normalize_amount(value):
    if value is None:
        return 0.0

    try:
        s = str(value)
        s = (
            s.replace("₹", "")
            .replace("Rs.", "")
            .replace("INR", "")
            .replace(",", "")
            .strip()
        )
        return float(s) if s else 0.0
    except:
        return 0.0


def _process_document(document_id: str, file_path: str):
    from database import SessionLocal
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        result = extract_financial_data(file_path)

        full_records = result.get("records", [])
        doc.sourceDepartment = result.get("department", "Unknown")

        # RESET financial records & anomalies (avoid duplicates)
        db.query(Anomaly).filter(
            Anomaly.recordId.in_(
                db.query(FinancialRecord.id).filter(FinancialRecord.documentId == document_id)
            )
        ).delete(synchronize_session=False)

        db.query(FinancialRecord).filter(
            FinancialRecord.documentId == document_id
        ).delete(synchronize_session=False)

        db.commit()

        normalized_records = []

        # Insert fresh records
        for r in full_records:
            amount = normalize_amount(r.get("amount"))

            rec = FinancialRecord(
                id=r.get("id", str(uuid.uuid4())),
                documentId=document_id,
                projectName=r.get("projectName", "Unnamed Item"),
                category=r.get("category", "General"),
                amount=amount,
                transactionDate=datetime.fromisoformat(r["transactionDate"])
                if r.get("transactionDate") else None
            )
            db.add(rec)

            normalized_records.append({
                "id": rec.id,
                "projectName": rec.projectName,
                "category": rec.category,
                "amount": amount
            })

        db.flush()

        # RUN ANOMALY DETECTION
        anomalies = detect_anomalies(normalized_records)

        for a in anomalies:
            db.add(Anomaly(
                id=a.get("id", str(uuid.uuid4())),
                recordId=a.get("recordId"),
                anomalyType=a.get("anomalyType"),
                description=a.get("description"),
                confidenceScore=a.get("confidenceScore", 0.0)
            ))

        doc.status = "completed"
        db.commit()

    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(background_tasks: BackgroundTasks,
                          file: UploadFile = File(...),
                          db: Session = Depends(get_db)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = Document(id=doc_id, fileName=file.filename, status="processing")
    db.add(doc)
    db.commit()

    background_tasks.add_task(_process_document, doc_id, file_path)

    return doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.uploadDate.desc()).all()


@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Delete local PDF file
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}