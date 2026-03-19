"""
Auditor Agent — pdfplumber-based extraction for digital government PDFs.
Works with CAG reports, state audit reports, budget documents, etc.
No external API required.
"""

import pdfplumber
import re
import uuid
from datetime import datetime


def extract_financial_data(pdf_path: str) -> dict:
    records = []
    full_text = ""

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                full_text += text + "\n"
                for table in (page.extract_tables() or []):
                    records.extend(_parse_table(table, page_num + 1))

        if not records:
            print("[Auditor] No tables found — trying text extraction")
            records = _parse_text_lines(full_text)

    except Exception as e:
        print(f"[Auditor] Extraction error: {e}")

    # Deduplicate by name+amount
    seen = {}
    unique_records = []
    for r in records:
        key = f"{r['projectName'].lower().strip()}_{r['amount']}"
        if key not in seen:
            seen[key] = True
            unique_records.append(r)

    # Enrich categories
    for r in unique_records:
        if r.get("category") in ("General", "", None):
            r["category"] = _infer_category(r["projectName"])

    department = _detect_department(full_text)
    year = _detect_year(full_text)

    print(f"[Auditor] Extracted {len(unique_records)} records — {department} ({year})")

    return {
        "records": unique_records,
        "department": department,
        "financialYear": year,
        "scheme": _detect_scheme(full_text),
    }


# ─────────────────────────────────────────────────────────────
# TABLE PARSER
# ─────────────────────────────────────────────────────────────

def _parse_table(table, page_num=1):
    results = []
    if not table or len(table) < 2:
        return results

    headers = [re.sub(r"\s+", " ", str(x or "")).lower().strip() for x in (table[0] or [])]

    name_idx        = _find_col(headers, ["name of department", "department", "scheme",
                                           "particulars", "particular", "head of account",
                                           "item", "project", "description", "work", "name"])
    expenditure_idx = _find_col(headers, ["expenditure", "actual expenditure", "actual",
                                           "amount", "total", "rs.", "inr", "outlay",
                                           "current year", "2024", "2023", "2022"])
    budget_idx      = _find_col(headers, ["budget provision", "budget", "provision",
                                           "sanctioned", "approved", "estimated", "previous year"])
    category_idx    = _find_col(headers, ["category", "type", "nature", "schedule", "sector"])
    date_idx        = _find_col(headers, ["date", "year", "period"])

    if name_idx < 0:
        name_idx = _find_first_text_col(table)
    if expenditure_idx < 0:
        expenditure_idx = _find_last_numeric_col(table)

    for row in table[1:]:
        if not row or not any(row):
            continue

        raw_name   = _safe_cell(row, name_idx, "")
        raw_amount = _safe_cell(row, expenditure_idx, "")

        if _is_skip_row(raw_name):
            continue

        amount = _clean_amount(raw_amount)
        if amount <= 0:
            continue

        if not raw_name or raw_name.strip().isdigit():
            raw_name = _first_text_cell(row) or "Unnamed Item"

        category = _safe_cell(row, category_idx, "") or _infer_category(raw_name)
        budget   = _clean_amount(_safe_cell(row, budget_idx, "0"))

        results.append({
            "id": str(uuid.uuid4()),
            "projectName": _clean_name(raw_name),
            "category": category,
            "amount": amount,
            "budgetProvision": budget,
            "transactionDate": _parse_date(_safe_cell(row, date_idx, "")),
            "pageNum": page_num,
        })

    return results


# ─────────────────────────────────────────────────────────────
# TEXT LINE PARSER — fallback
# ─────────────────────────────────────────────────────────────

def _parse_text_lines(text):
    results = []
    pattern = re.compile(
        r"^([A-Za-z][A-Za-z0-9 &\-/\(\)\.]{3,80}?)\s*[:\.\-]{0,3}\s*"
        r"((?:₹\s*)?[\d,]{4,}(?:\.\d{1,2})?)\s*$"
    )
    for line in text.split("\n"):
        line = line.strip()
        if not line or len(line) < 8:
            continue
        m = pattern.match(line)
        if not m:
            continue
        name = _clean_name(m.group(1))
        amt  = _clean_amount(m.group(2))
        if not name or amt <= 0 or _is_skip_name(name):
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


# ─────────────────────────────────────────────────────────────
# COLUMN DETECTION
# ─────────────────────────────────────────────────────────────

def _find_col(headers, keywords):
    for i, h in enumerate(headers):
        if any(k in h for k in keywords):
            return i
    return -1


def _find_first_text_col(table):
    if not table or not table[0]:
        return 0
    for col_idx in range(len(table[0])):
        text_count = sum(
            1 for row in table[1:6]
            if col_idx < len(row) and str(row[col_idx] or "").strip()
            and not re.match(r"^[\d\.,\-\(\)₹\s]+$", str(row[col_idx] or "").strip())
        )
        if text_count >= 2:
            return col_idx
    return 0


def _find_last_numeric_col(table):
    if not table or not table[0]:
        return -1
    for col_idx in range(len(table[0]) - 1, -1, -1):
        num_count = sum(
            1 for row in table[1:6]
            if col_idx < len(row) and str(row[col_idx] or "").strip()
            and re.match(r"^[\d\.,\-\(\)₹\s]+$", str(row[col_idx] or "").strip())
            and len(str(row[col_idx] or "").strip()) > 1
        )
        if num_count >= 2:
            return col_idx
    return -1


# ─────────────────────────────────────────────────────────────
# ROW / NAME HELPERS
# ─────────────────────────────────────────────────────────────

def _is_skip_row(name):
    name_lower = (name or "").lower().strip()
    skip = ["total", "grand total", "sub total", "sub-total", "nil",
            "---", "s.no", "sl.no", "serial", "sr.no", "source", "note"]
    if any(s in name_lower for s in skip):
        return True
    if re.match(r"^\d+\.?$", name_lower):
        return True
    return False


def _is_skip_name(name):
    name_lower = name.lower()
    return any(s in name_lower for s in
               ["total", "grand total", "sub total", "page", "source", "note", "nil"])


def _clean_name(name):
    if not name:
        return "Unnamed Item"
    name = re.sub(r"^\s*[\d]+[\.\)]\s*", "", name)
    name = re.sub(r"^\s*[ivxlcdmIVXLCDM]+[\.\)]\s*", "", name)
    name = re.sub(r"^\s*[\(\[][a-zA-Z\d]+[\)\]]\s*", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name if len(name) > 2 else "Unnamed Item"


def _first_text_cell(row):
    for cell in row:
        val = str(cell or "").strip()
        if val and not re.match(r"^[\d\.,\-\(\)₹\s]+$", val) and len(val) > 2:
            return val
    return ""


def _safe_cell(row, idx, default=""):
    try:
        if idx < 0:
            return default
        val = row[idx]
        return str(val).strip() if val else default
    except:
        return default


# ─────────────────────────────────────────────────────────────
# AMOUNT / DATE HELPERS
# ─────────────────────────────────────────────────────────────

def _clean_amount(value):
    if not value:
        return 0.0
    v = re.sub(r"[₹,Rs.\s]", "", str(value))
    v = re.sub(r"[A-Za-z]", "", v)
    if v.startswith("(") and v.endswith(")"):
        v = "-" + v[1:-1]
    v = v.strip()
    try:
        return float(v) if v else 0.0
    except:
        return 0.0


def _parse_date(s):
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%Y"):
        try:
            return datetime.strptime(s.strip(), fmt).isoformat()
        except:
            pass
    return None


# ─────────────────────────────────────────────────────────────
# METADATA DETECTION
# ─────────────────────────────────────────────────────────────

def _detect_department(text):
    patterns = [
        r"nagar nigam\s+[A-Za-z]+",
        r"government of [A-Za-z ]+?(?=\n|audit|balance)",
        r"department of [A-Za-z &,]+?(?=\n|,|\.|for)",
        r"ministry of [A-Za-z &,]+?(?=\n|,|\.|for)",
        r"office of the [A-Za-z &,]+?(?=\n|,|\.)",
        r"comptroller and auditor general",
    ]
    for p in patterns:
        m = re.search(p, text, re.I)
        if m:
            return m.group(0).strip().title()
    for line in text.split("\n")[:10]:
        line = line.strip()
        if line and len(line) > 5 and not re.match(r"^[\d\W]+$", line):
            return line.title()
    return "Unknown Department"


def _detect_year(text):
    m = re.search(r"(?:year|fy|financial year|period)[:\s]*(\d{4}[-–]\d{2,4})", text, re.I)
    if m:
        return m.group(1)
    m = re.search(r"\b(\d{4}[-–]\d{2,4})\b", text)
    return m.group(1) if m else None


def _detect_scheme(text):
    m = re.search(r"(?:scheme|programme|yojana|mission)[:\s]+([A-Za-z ]{4,60})", text, re.I)
    return m.group(1).strip().title() if m else None


def _infer_category(name):
    name_lower = (name or "").lower()
    mapping = {
        r"salary|wage|pay|allowance|pension|staff|employee|establishment": "Personnel",
        r"road|bridge|construction|building|civil|infrastructure|drain": "Infrastructure",
        r"medical|health|hospital|medicine|drug|sanit": "Health",
        r"school|education|training|scholarship|book|uniform": "Education",
        r"purchase|procurement|supply|material|stationery|equipment|furniture": "Procurement",
        r"travel|transport|vehicle|fuel|conveyance": "Travel & Transport",
        r"electricity|water|telephone|rent|maintenance|repair": "Utilities & Maintenance",
        r"scheme|programme|project|yojana|mission|grant|fund": "Scheme/Programme",
        r"tax|revenue|income|receipt|collection": "Revenue",
        r"depreciation|revaluation|reserve": "Accounting Adjustment",
        r"liability|payable|outstanding": "Liability",
        r"asset|property|land|investment": "Fixed Asset",
        r"receivable|debtor|advance|loan": "Current Asset",
        r"social welfare|welfare|subsidy|relief": "Social Welfare",
        r"urban|municipal|civic|nagar": "Municipal Services",
        r"labour|employment|mgnrega": "Labour & Employment",
        r"disaster|flood|emergency": "Disaster Management",
    }
    for pattern, category in mapping.items():
        if re.search(pattern, name_lower):
            return category
    return "General"