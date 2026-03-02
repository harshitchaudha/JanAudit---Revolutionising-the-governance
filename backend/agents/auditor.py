"""
Auditor Agent — OCR & PDF Parsing.
Extracts text and tabular financial data from PDF documents using pdfplumber.
"""

import pdfplumber
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any


def extract_financial_data(pdf_path: str) -> Dict[str, Any]:
    """
    Process a PDF file and extract structured financial data.
    Returns a dict with 'records' (list of financial line items) and 'department'.
    """
    records: List[Dict[str, Any]] = []
    full_text = ""
    department = "Unknown"

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract text
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

                # Extract tables
                tables = page.extract_tables()
                for table in tables:
                    records.extend(_parse_table(table))

        # If no tables found, try to parse from text
        if not records:
            records = _parse_text_records(full_text)

        # Try to detect department from text
        department = _detect_department(full_text)

    except Exception as e:
        raise RuntimeError(f"PDF processing failed: {str(e)}")

    return {
        "records": records,
        "department": department,
        "raw_text": full_text[:5000]  # Keep first 5k chars for reference
    }


def _parse_table(table: List[List[str]]) -> List[Dict[str, Any]]:
    """Parse a table extracted by pdfplumber into financial records."""
    records = []
    if not table or len(table) < 2:
        return records

    # Use first row as header hints
    headers = [str(cell).lower().strip() if cell else "" for cell in table[0]]

    # Try to identify column indices
    name_idx = _find_col(headers, ["project", "name", "description", "item", "particulars", "head"])
    category_idx = _find_col(headers, ["category", "type", "sector", "department", "scheme"])
    amount_idx = _find_col(headers, ["amount", "expenditure", "total", "budget", "cost", "rs", "inr"])
    date_idx = _find_col(headers, ["date", "period", "year"])

    for row in table[1:]:
        if not row or all(cell is None or str(cell).strip() == "" for cell in row):
            continue

        record = {
            "id": str(uuid.uuid4()),
            "projectName": _safe_get(row, name_idx, "Unnamed Item"),
            "category": _safe_get(row, category_idx, "General"),
            "amount": _extract_amount(_safe_get(row, amount_idx, "0")),
            "transactionDate": _extract_date(_safe_get(row, date_idx, ""))
        }

        # Only add if there's a meaningful amount
        if record["amount"] != 0.0 or record["projectName"] != "Unnamed Item":
            records.append(record)

    return records


def _parse_text_records(text: str) -> List[Dict[str, Any]]:
    """Fallback: extract financial data from unstructured text using regex patterns."""
    records = []

    # Pattern: look for lines with amounts (Rs., INR, ₹, or large numbers)
    amount_pattern = re.compile(
        r'(.{5,60}?)\s*[:\-–]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)\s*(?:crore|lakh|thousand|lakhs|crores)?',
        re.IGNORECASE
    )

    for match in amount_pattern.finditer(text):
        name = match.group(1).strip()
        amount_str = match.group(2)

        # Clean name
        name = re.sub(r'^[\d\.\)\]\s]+', '', name).strip()
        if len(name) < 3:
            continue

        record = {
            "id": str(uuid.uuid4()),
            "projectName": name[:100],
            "category": "General",
            "amount": _extract_amount(amount_str),
            "transactionDate": None
        }

        if record["amount"] > 0:
            records.append(record)

    return records


def _detect_department(text: str) -> str:
    """Try to identify the government department from the document text."""
    dept_patterns = [
        r'(?:department|ministry|directorate)\s+of\s+([A-Za-z\s&]+)',
        r'(?:govt|government)\s+of\s+([A-Za-z\s]+)',
    ]
    for pattern in dept_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:80]
    return "Unknown"


def _find_col(headers: List[str], keywords: List[str]) -> int:
    """Find column index matching any of the keywords."""
    for i, h in enumerate(headers):
        for kw in keywords:
            if kw in h:
                return i
    return -1


def _safe_get(row: list, idx: int, default: str = "") -> str:
    """Safely get value from a row by index."""
    if idx < 0 or idx >= len(row) or row[idx] is None:
        return default
    return str(row[idx]).strip() or default


def _extract_amount(value: str) -> float:
    """Parse a monetary string into a float."""
    try:
        cleaned = re.sub(r'[^\d.]', '', str(value))
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0


def _extract_date(value: str) -> str | None:
    """Try to parse a date string. Returns ISO string or None."""
    if not value or not value.strip():
        return None
    date_formats = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d.%m.%Y", "%B %Y", "%b %Y"]
    for fmt in date_formats:
        try:
            return datetime.strptime(value.strip(), fmt).isoformat()
        except ValueError:
            continue
    return None
