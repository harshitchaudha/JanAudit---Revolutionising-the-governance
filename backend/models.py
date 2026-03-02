"""
SQLAlchemy ORM models for JanAudit.
"""

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    fileName = Column(String, nullable=False)
    uploadDate = Column(DateTime, default=datetime.utcnow)
    sourceDepartment = Column(String, default="Unknown")
    status = Column(String, default="processing")  # processing | completed | failed

    records = relationship("FinancialRecord", back_populates="document", cascade="all, delete-orphan")
    rti_drafts = relationship("RTIDraft", back_populates="document", cascade="all, delete-orphan")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    documentId = Column(String, ForeignKey("documents.id"), nullable=False)
    projectName = Column(String, default="")
    category = Column(String, default="")
    amount = Column(Float, default=0.0)
    transactionDate = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="records")
    anomalies = relationship("Anomaly", back_populates="record", cascade="all, delete-orphan")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, default=generate_uuid)
    recordId = Column(String, ForeignKey("financial_records.id"), nullable=False)
    anomalyType = Column(String, default="")
    description = Column(Text, default="")
    confidenceScore = Column(Float, default=0.0)

    record = relationship("FinancialRecord", back_populates="anomalies")
    rti_drafts = relationship("RTIDraft", back_populates="anomaly", cascade="all, delete-orphan")


class RTIDraft(Base):
    __tablename__ = "rti_drafts"

    id = Column(String, primary_key=True, default=generate_uuid)
    documentId = Column(String, ForeignKey("documents.id"), nullable=False)
    anomalyId = Column(String, ForeignKey("anomalies.id"), nullable=True)
    generatedDate = Column(DateTime, default=datetime.utcnow)
    draftContent = Column(Text, default="")

    document = relationship("Document", back_populates="rti_drafts")
    anomaly = relationship("Anomaly", back_populates="rti_drafts")
