"""
Auditor Agent — Improved PDF Extraction with richer context
"""

import pdfplumber
import re
import uuid
from datetime import datetime


def extract_financial_data(pdf_path):
    records = []
    full_text = ""
    all_tables = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            full_text += text + "\n"

            tables = page.extract_tables()
            for table in tables:
                parsed = _parse_table(table, page_num + 1)
                records.extend(parsed)
                all_tables.append(table)

    # Only fall back to text parsing if truly no structured data found
    if not records:
        records = _parse_text(full_text)

    # Enrich records with document-level context
    department = _detect_department(full_text)
    year = _detect_year(full_text)
    scheme = _detect_scheme(full_text)

    for r in records:
        if r.get("category") in ("General", "", None):
            r["category"] = scheme or "General"
        r["department"] = department
        r["financialYear"] = year

    return {
        "records": records,
        "department": department,
        "financialYear": year,
        "scheme": scheme,
    }


def _parse_table(table, page_num=1):
    results = []
    if not table or len(table) < 2:
        return results

    # Clean headers
    headers = [re.sub(r"\s+", " ", str(x or "")).lower().strip() for x in table[0]]

    name_idx     = _find(headers, ["head of account", "scheme", "project", "item", "particulars", "particular", "name", "description", "work"])
    category_idx = _find(headers, ["category", "type", "nature", "sub-head", "sub head", "major head"])
    amount_idx   = _find(headers, ["actual expenditure", "expenditure", "amount", "total", "rs.", "inr", "outlay", "disbursement", "payment"])
    budget_idx   = _find(headers, ["budget", "provision", "sanctioned", "approved", "estimated"])
    date_idx     = _find(headers, ["date", "year", "month", "period"])

    for row_num, row in enumerate(table[1:], start=2):
        if not row or not any(cell for cell in row if cell):
            continue

        raw_name = _safe(row, name_idx, "")
        raw_amount = _safe(row, amount_idx, "")

        # Skip rows that look like sub-headers or totals
        lower_name = raw_name.lower()
        if any(skip in lower_name for skip in ["total", "grand total", "sub total", "nil", "---"]):
            continue

        amount = _clean_amount(raw_amount)
        if amount <= 0:
            continue

        # Try to get a meaningful name — fallback to first non-empty cell
        if not raw_name or raw_name == "Unnamed Item":
            raw_name = _first_nonempty(row) or "Unnamed Item"

        category = _safe(row, category_idx, "")
        if not category:
            category = _infer_category(raw_name)

        budget_provision = _clean_amount(_safe(row, budget_idx, "0"))

        r = {
            "id": str(uuid.uuid4()),
            "projectName": _clean_name(raw_name),
            "category": category or "General",
            "amount": amount,
            "budgetProvision": budget_provision,
            "transactionDate": _parse_date(_safe(row, date_idx)),
            "pageNum": page_num,
            "rowNum": row_num,
        }
        results.append(r)

    return results


def _parse_text(text):
    """
    Fallback text parser — uses stricter patterns to avoid noise.
    Looks for lines that have a label and a currency amount.
    """
    results = []
    lines = text.split("\n")

    # Pattern: "Some description text ..... ₹1,23,456" or "Some text : 1,23,456"
    pattern = re.compile(
        r"^([A-Za-z][A-Za-z0-9 \-/\(\)]{4,80}?)\s*[:\.\-]{0,3}\s*(₹\s*[\d,]+(?:\.\d+)?|[\d,]{4,}(?:\.\d+)?)\s*$"
    )

    for line in lines:
        line = line.strip()
        if not line:
            continue
        m = pattern.match(line)
        if not m:
            continue

        name = _clean_name(m.group(1))
        amt = _clean_amount(m.group(2))

        # Skip if name looks like a header or footer
        if not name or amt <= 0:
            continue
        if any(skip in name.lower() for skip in ["total", "page", "table", "source", "note", "figure"]):
            continue

        results.append({
            "id": str(uuid.uuid4()),
            "projectName": name,
            "category": _infer_category(name),
            "amount": amt,
            "budgetProvision": 0,
            "transactionDate": None,
        })

    return results


def _clean_name(name):
    """Remove numbering, extra whitespace, special chars from item names."""
    if not name:
        return "Unnamed Item"
    # Remove leading numbering like "1.", "2)", "i.", "a)"
    name = re.sub(r"^\s*[\d]+[\.\)]\s*", "", name)
    name = re.sub(r"^\s*[ivxlIVXL]+[\.\)]\s*", "", name)
    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip()
    return name if len(name) > 2 else "Unnamed Item"


def _infer_category(name):
    """Infer category from item name keywords."""
    name_lower = name.lower()
    mapping = {
        "salary|wage|pay|allowance|pension|staff|employee|hr": "Personnel",
        "road|bridge|construction|building|civil|infrastructure|work": "Infrastructure",
        "medical|health|hospital|medicine|drug|equipment": "Health",
        "school|education|training|scholarship|book|uniform": "Education",
        "purchase|procurement|supply|material|stationery|equipment|furniture": "Procurement",
        "travel|transport|vehicle|fuel|tour|TA|DA": "Travel & Transport",
        "electricity|water|telephone|internet|utility|rent|maintenance": "Utilities & Maintenance",
        "scheme|programme|project|yojana|mission": "Scheme/Programme",
        "audit|inspection|survey|study|consultant": "Administrative",
    }
    for pattern, category in mapping.items():
        if re.search(pattern, name_lower):
            return category
    return "General"


def _clean_amount(value):
    if not value:
        return 0.0
    # Remove currency symbols, spaces, text
    v = re.sub(r"[₹,Rs.\s]", "", str(value))
    v = re.sub(r"[A-Za-z]", "", v)
    v = v.strip()
    try:
        return float(v) if v else 0.0
    except:
        return 0.0


def _detect_department(text):
    patterns = [
        r"department\s+of\s+([A-Za-z &,]+)",
        r"ministry\s+of\s+([A-Za-z &,]+)",
        r"office\s+of\s+the\s+([A-Za-z &,]+)",
        r"directorate\s+of\s+([A-Za-z &,]+)",
        r"commissioner(?:ate)?\s+of\s+([A-Za-z &,]+)",
    ]
    for p in patterns:
        m = re.search(p, text, re.I)
        if m:
            return m.group(1).strip().title()
    return "Unknown Department"


def _detect_year(text):
    m = re.search(r"(?:financial year|year|fy)[:\s]*(\d{4}[\-–]\d{2,4})", text, re.I)
    if m:
        return m.group(1)
    m = re.search(r"(\d{4}[\-–]\d{2,4})", text)
    if m:
        return m.group(1)
    return None


def _detect_scheme(text):
    m = re.search(r"(?:scheme|programme|project|yojana|mission)[:\s]+([A-Za-z ]{4,60})", text, re.I)
    if m:
        return m.group(1).strip().title()
    return None


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


def _first_nonempty(row):
    for cell in row:
        val = str(cell).strip() if cell else ""
        if val and val.lower() not in ("none", "null", ""):
            return val
    return ""


def _parse_date(s):
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%Y", "%Y"):
        try:
            return datetime.strptime(s.strip(), fmt).isoformat()
        except:
            pass
    return None