"""
RAG Agent — Retrieves Relevant Sections of the Right to Information Act, 2005.
Provides legal context for RTI draft generation based on anomaly type and description.
"""

from typing import List, Dict


# ─────────────────────────────────────────────────────────────
# INTERNAL KNOWLEDGE BASE
# ─────────────────────────────────────────────────────────────

LEGAL_KB = [
    {
        "section": "Section 6(1) – Right to File RTI Application",
        "keywords": ["request", "information", "application", "file", "citizen"]
    },
    {
        "section": "Section 7(1) – Mandatory 30-Day Reply Period",
        "keywords": ["delay", "reply", "response", "within 30", "timeline"]
    },
    {
        "section": "Section 2(j) – Right to Inspect Records, Documents, and Works",
        "keywords": ["inspect", "records", "documents", "audit", "verification"]
    },
    {
        "section": "Section 2(f) – Right to Obtain Certified Copies of Records",
        "keywords": ["copies", "certified", "documents"]
    },
    {
        "section": "Section 4(1)(b) – Mandatory Proactive Disclosure of Financial Data",
        "keywords": ["financial", "expenditure", "budget", "funds", "misuse"]
    },
    {
        "section": "Section 4(1)(d) – Reasons for Administrative or Financial Decisions",
        "keywords": ["reason", "decision", "explanation", "why"]
    },
    {
        "section": "Section 20 – Penalties for Suppression or Delay",
        "keywords": ["penalty", "non compliance", "violation", "refusal"]
    },
    {
        "section": "Section 18 – Complaint to Information Commission",
        "keywords": ["complaint", "appeal", "refusal", "denial", "not receive"]
    },
    {
        "section": "Section 8(1)(j) – Personal Information Exemption",
        "keywords": ["personal", "privacy", "exemption"]
    },
]


# ─────────────────────────────────────────────────────────────
# ANOMALY TYPE → LEGAL MAPPING
# ─────────────────────────────────────────────────────────────

ANOMALY_TO_LEGAL = {
    "Statistical Outlier": ["financial", "records", "audit", "expenditure"],
    "IQR Outlier": ["financial", "records", "budget"],
    "Suspiciously Round Amount": ["expenditure", "misuse", "funds"],
    "Invalid Amount": ["financial", "records", "explanation"],
    "Duplicate Entry Discrepancy": ["duplicate", "records", "audit", "verification"],
}


# ─────────────────────────────────────────────────────────────
# RAG LOOKUP FUNCTION
# ─────────────────────────────────────────────────────────────

def get_legal_context(query_text: str = "", anomaly_type: str = "") -> List[Dict]:
    """
    Retrieve relevant legal sections based on textual context + anomaly type.
    """

    query = (query_text + " " + anomaly_type).lower()

    matched_sections = []

    # 1. Map anomaly types → relevant keywords
    if anomaly_type in ANOMALY_TO_LEGAL:
        for kw in ANOMALY_TO_LEGAL[anomaly_type]:
            if kw not in query:
                query += f" {kw}"

    # 2. Match KB sections
    for item in LEGAL_KB:
        for kw in item["keywords"]:
            if kw.lower() in query:
                matched_sections.append({"section": item["section"]})
                break

    # 3. Always include the RTI core filing section
    if not any("Section 6(1)" in s["section"] for s in matched_sections):
        matched_sections.insert(0, {"section": "Section 6(1) – Right to File RTI Application"})

    # 4. If no specific matches → provide general RTI legal anchors
    if len(matched_sections) <= 1:
        matched_sections.append({"section": "Section 2(j) – Right to Inspect Records"})
        matched_sections.append({"section": "Section 4(1)(b) – Mandatory Financial Disclosure"})

    # Remove duplicates
    unique = []
    seen = set()

    for sec in matched_sections:
        if sec["section"] not in seen:
            seen.add(sec["section"])
            unique.append(sec)

    return unique