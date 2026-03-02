"""
Anomalies Router — Endpoints for viewing detected anomalies.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Anomaly, FinancialRecord
from schemas import AnomalyResponse, AnomalyDetailResponse

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=List[AnomalyDetailResponse])
def list_anomalies(
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type"),
    min_confidence: Optional[float] = Query(None, description="Minimum confidence score"),
    db: Session = Depends(get_db)
):
    """List all detected anomalies with optional filters."""
    query = db.query(Anomaly).options(joinedload(Anomaly.record))

    if anomaly_type:
        query = query.filter(Anomaly.anomalyType == anomaly_type)
    if min_confidence is not None:
        query = query.filter(Anomaly.confidenceScore >= min_confidence)

    return query.order_by(Anomaly.confidenceScore.desc()).all()


@router.get("/types", response_model=List[str])
def get_anomaly_types(db: Session = Depends(get_db)):
    """Get all distinct anomaly types."""
    results = db.query(Anomaly.anomalyType).distinct().all()
    return [r[0] for r in results]


@router.get("/{anomaly_id}", response_model=AnomalyDetailResponse)
def get_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    """Get a specific anomaly with its associated financial record."""
    anomaly = (
        db.query(Anomaly)
        .options(joinedload(Anomaly.record))
        .filter(Anomaly.id == anomaly_id)
        .first()
    )
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found.")
    return anomaly
