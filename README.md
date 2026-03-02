# JanAudit: Revolutionising Governance through AI ⚖️

JanAudit is an AI-powered civic-tech platform designed to empower citizens and activists by bridging the gap between complex government financial reports and public accountability.

## 🚀 Overview
The system processes unstructured PDF financial reports from government departments, extracts structured expenditure data using AI agents, detects anomalies or suspicious spending patterns, and helps users act on these findings by generating legally compliant **Right to Information (RTI)** application drafts.

## ✨ Key Features
- **Intelligent Extraction**: AI-driven PDF parsing that transforms tabular data from financial reports into structured records.
- **Anomaly Detection**: Statistical flagging of unusual spending (z-score, IQR, and heuristic checks for duplicates/round numbers).
- **RAG-Powered Legal Context**: Retrieval of relevant sections from the RTI Act, 2005 to provide legal grounding for findings.
- **Automated RTI Drafting**: One-click generation of formal RTI applications tailored to detected anomalies.
- **Interactive Dashboard**: Visualizations of expenditure trends and departmental spending metrics.
- **Dark/Light Themes**: Premium UI designed for clarity and visual appeal.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Chart.js, Vanilla CSS (Glassmorphism inspired)
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **AI/ML**: `pdfplumber` (parsing), NumPy/Pandas (analytics), Scikit-learn (embeddings), FAISS (vector search)
- **Database**: SQLite (MVP)

## 📦 Project Structure
- `/backend`: FastAPI server, AI agents, and database models.
- `/frontend`: React application and design system.

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## ⚖️ License
MIT License. Created for civic transparency and government accountability.
