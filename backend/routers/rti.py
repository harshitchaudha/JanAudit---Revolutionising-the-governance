"""
RTI Router — RTI draft generation and management endpoints.
"""

from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import RTIDraft, Anomaly, FinancialRecord, Document
from schemas import RTIDraftRequest, RTIDraftResponse
from agents.drafter import generate_rti_draft
from agents.rag import get_legal_context

router = APIRouter(prefix="/api/rti", tags=["RTI Workspace"])


@router.post("/generate", response_model=RTIDraftResponse)
def generate_draft(request: RTIDraftRequest, db: Session = Depends(get_db)):
    """Generate an RTI application draft for a specific anomaly."""
    # Fetch anomaly
    anomaly = db.query(Anomaly).filter(Anomaly.id == request.anomalyId).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found.")

    # Fetch associated record
    record = db.query(FinancialRecord).filter(FinancialRecord.id == anomaly.recordId).first()
    if not record:
        raise HTTPException(status_code=404, detail="Associated financial record not found.")

    # Fetch document
    document = db.query(Document).filter(Document.id == record.documentId).first()

    # Get legal context from RAG agent
    legal_sections = get_legal_context(anomaly.description, anomaly.anomalyType)

    # Generate draft using Drafting agent
    draft_content = generate_rti_draft(
        anomaly={
            "anomalyType": anomaly.anomalyType,
            "description": anomaly.description,
            "confidenceScore": anomaly.confidenceScore
        },
        record={
            "projectName": record.projectName,
            "category": record.category,
            "amount": record.amount
        },
        document={
            "fileName": document.fileName if document else "Unknown",
            "sourceDepartment": document.sourceDepartment if document else "Unknown"
        },
        legal_sections=legal_sections
    )

    # Save draft to database
    draft = RTIDraft(
        documentId=record.documentId,
        anomalyId=anomaly.id,
        draftContent=draft_content
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    return draft


@router.get("/drafts", response_model=List[RTIDraftResponse])
def list_drafts(db: Session = Depends(get_db)):
    """List all generated RTI drafts."""
    return db.query(RTIDraft).order_by(RTIDraft.generatedDate.desc()).all()


@router.get("/drafts/{draft_id}", response_model=RTIDraftResponse)
def get_draft(draft_id: str, db: Session = Depends(get_db)):
    """Get a specific RTI draft."""
    draft = db.query(RTIDraft).filter(RTIDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="RTI draft not found.")
    return draft


@router.get("/legal-context")
def get_legal_ref(query: str):
    """Get relevant RTI Act sections for a given query."""
    sections = get_legal_context(query)
    return {"sections": sections}
