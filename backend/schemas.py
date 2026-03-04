"""
Pydantic schemas for request/response serialization.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Auth / User ───────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    fullName: str
    role: str = "citizen"  # citizen | journalist

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    createdAt: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    role: str
    fullName: str


# ─── Document ───────────────────────────────────────────────

class DocumentBase(BaseModel):
    fileName: str
    sourceDepartment: Optional[str] = "Unknown"

class DocumentResponse(BaseModel):
    id: str
    fileName: str
    uploadDate: datetime
    sourceDepartment: str
    status: str

    class Config:
        from_attributes = True


# ─── Financial Record ──────────────────────────────────────

class FinancialRecordResponse(BaseModel):
    id: str
    documentId: str
    projectName: str
    category: str
    amount: float
    transactionDate: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Anomaly ───────────────────────────────────────────────

class AnomalyResponse(BaseModel):
    id: str
    recordId: str
    anomalyType: str
    description: str
    confidenceScore: float

    class Config:
        from_attributes = True

class AnomalyDetailResponse(AnomalyResponse):
    record: Optional[FinancialRecordResponse] = None

    class Config:
        from_attributes = True


# ─── RTI Draft ─────────────────────────────────────────────

class RTIDraftRequest(BaseModel):
    anomalyId: str

class RTIDraftResponse(BaseModel):
    id: str
    documentId: str
    anomalyId: Optional[str] = None
    generatedDate: datetime
    draftContent: str

    class Config:
        from_attributes = True


# ─── Dashboard / Stats ─────────────────────────────────────

class DashboardStats(BaseModel):
    documentsProcessed: int
    totalExpenditure: float
    anomaliesDetected: int
    rtiDraftsGenerated: int


# ─── Document Detail ───────────────────────────────────────

class DocumentDetailResponse(DocumentResponse):
    records: List[FinancialRecordResponse] = []

    class Config:
        from_attributes = True
