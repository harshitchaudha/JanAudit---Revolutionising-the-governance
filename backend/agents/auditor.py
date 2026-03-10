"""
Auditor Agent — Improved PDF Extraction
"""

import pdfplumber
import re
import uuid
from datetime import datetime


def extract_financial_data(pdf_path):
    records = []
    full_text = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            full_text += text + "\n"

            tables = page.extract_tables()
            for table in tables:
                records.extend(_parse_table(table))

    if not records:
        records = _parse_text(full_text)

    return {"records": records, "department": _detect_department(full_text)}


def _parse_table(table):
    results = []
    if not table or len(table) < 2:
        return results

    headers = [str(x).lower().strip() for x in table[0]]

    name_idx = _find(headers, ["project", "item", "name", "particular"])
    category_idx = _find(headers, ["category", "type"])
    amount_idx = _find(headers, ["amount", "expenditure", "total", "rs", "inr"])
    date_idx = _find(headers, ["date", "year"])

    for row in table[1:]:
        if not any(row):
            continue

        r = {
            "id": str(uuid.uuid4()),
            "projectName": _safe(row, name_idx, "Unnamed Item"),
            "category": _safe(row, category_idx, "General"),
            "amount": _clean_amount(_safe(row, amount_idx)),
            "transactionDate": _parse_date(_safe(row, date_idx))
        }

        if r["amount"] > 0:
            results.append(r)

    return results


def _parse_text(text):
    results = []
    pattern = re.compile(r"(.{5,60})\s*[:\-]?\s*(₹?\d[\d,\.]+)")

    for m in pattern.finditer(text):
        name = m.group(1).strip()
        amt = _clean_amount(m.group(2))
        if amt <= 0:
            continue

        results.append({
            "id": str(uuid.uuid4()),
            "projectName": name,
            "category": "General",
            "amount": amt,
            "transactionDate": None
        })

    return results


def _clean_amount(value):
    v = re.sub(r"[₹,Rs. INR ]", "", str(value))
    try:
        return float(v)
    except:
        return 0.0


def _detect_department(text):
    m = re.search(r"department of ([A-Za-z ]+)", text, re.I)
    return m.group(1) if m else "Unknown"


def _find(headers, keys):
    for i, h in enumerate(headers):
        if any(k in h for k in keys):
            return i
    return -1


def _safe(row, idx, default=""):
    try:
        if idx < 0:
            return default
        val = row[idx]
        return str(val).strip() if val else default
    except:
        return default


def _parse_date(s):
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).isoformat()
        except:
            pass
    return None