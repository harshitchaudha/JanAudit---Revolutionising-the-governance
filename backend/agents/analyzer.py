"""
Analyzer Agent — Statistical Anomaly Detection.
Scans extracted financial records and flags unusual expenditure patterns.
"""

import numpy as np
import uuid
from typing import List, Dict, Any


def detect_anomalies(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyze a list of financial records and detect anomalies.
    Uses statistical methods (z-score, IQR) and heuristic checks.
    Returns a list of anomaly dicts.
    """
    anomalies: List[Dict[str, Any]] = []

    if not records:
        return anomalies

    amounts = [r.get("amount", 0) for r in records]

    # ─── Statistical anomalies (z-score) ───
    if len(amounts) >= 3:
        anomalies.extend(_zscore_anomalies(records, amounts))

    # ─── IQR-based outliers ───
    if len(amounts) >= 4:
        anomalies.extend(_iqr_anomalies(records, amounts))

    # ─── Heuristic checks ───
    anomalies.extend(_heuristic_checks(records))

    # Deduplicate by recordId + anomalyType
    seen = set()
    unique = []
    for a in anomalies:
        key = (a["recordId"], a["anomalyType"])
        if key not in seen:
            seen.add(key)
            unique.append(a)

    return unique


def _zscore_anomalies(records: List[Dict], amounts: List[float]) -> List[Dict]:
    """Detect outliers using z-score (threshold > 2.0)."""
    anomalies = []
    arr = np.array(amounts, dtype=float)
    mean = np.mean(arr)
    std = np.std(arr)

    if std == 0:
        return anomalies

    z_scores = np.abs((arr - mean) / std)

    for i, z in enumerate(z_scores):
        if z > 2.0:
            confidence = min(round(float(z) / 4.0, 2), 1.0)
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": records[i].get("id", ""),
                "anomalyType": "Statistical Outlier",
                "description": (
                    f"Amount ₹{amounts[i]:,.2f} is {z:.1f} standard deviations from the mean "
                    f"(₹{mean:,.2f}). This expenditure is significantly higher/lower than "
                    f"comparable items in this document."
                ),
                "confidenceScore": confidence
            })

    return anomalies


def _iqr_anomalies(records: List[Dict], amounts: List[float]) -> List[Dict]:
    """Detect outliers using Interquartile Range method."""
    anomalies = []
    arr = np.array(amounts, dtype=float)
    q1 = np.percentile(arr, 25)
    q3 = np.percentile(arr, 75)
    iqr = q3 - q1

    if iqr == 0:
        return anomalies

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    for i, amount in enumerate(amounts):
        if amount < lower or amount > upper:
            direction = "above" if amount > upper else "below"
            confidence = min(round(abs(amount - (upper if amount > upper else lower)) / iqr * 0.3, 2), 1.0)
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": records[i].get("id", ""),
                "anomalyType": "IQR Outlier",
                "description": (
                    f"Amount ₹{amount:,.2f} falls {direction} the acceptable range "
                    f"(₹{lower:,.2f} - ₹{upper:,.2f}). This may indicate an irregularity "
                    f"in the reported expenditure."
                ),
                "confidenceScore": confidence
            })

    return anomalies


def _heuristic_checks(records: List[Dict]) -> List[Dict]:
    """Apply rule-based checks for common irregularities."""
    anomalies = []

    # Check for suspiciously round amounts
    for r in records:
        amount = r.get("amount", 0)
        rid = r.get("id", "")

        # Very large round numbers (potential estimate rather than actual)
        if amount > 0 and amount >= 100000 and amount % 10000 == 0:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": rid,
                "anomalyType": "Suspiciously Round Amount",
                "description": (
                    f"Amount ₹{amount:,.2f} is a suspiciously round figure, which may "
                    f"indicate an estimated rather than actual expenditure."
                ),
                "confidenceScore": 0.35
            })

        # Zero or negative amounts
        if amount <= 0:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": rid,
                "anomalyType": "Missing/Invalid Amount",
                "description": (
                    f"Record '{r.get('projectName', 'Unknown')}' has zero or negative amount "
                    f"(₹{amount:,.2f}). This may indicate missing or incorrectly reported data."
                ),
                "confidenceScore": 0.6
            })

    # Check for duplicate project names with different amounts
    name_amounts: Dict[str, List[float]] = {}
    name_ids: Dict[str, List[str]] = {}
    for r in records:
        name = r.get("projectName", "").lower().strip()
        if name and name != "unnamed item":
            name_amounts.setdefault(name, []).append(r.get("amount", 0))
            name_ids.setdefault(name, []).append(r.get("id", ""))

    for name, amts in name_amounts.items():
        if len(amts) > 1 and len(set(amts)) > 1:
            for rid in name_ids[name]:
                anomalies.append({
                    "id": str(uuid.uuid4()),
                    "recordId": rid,
                    "anomalyType": "Duplicate Entry Discrepancy",
                    "description": (
                        f"Project '{name}' appears multiple times with different amounts. "
                        f"This may indicate duplicate billing or data entry errors."
                    ),
                    "confidenceScore": 0.7
                })

    return anomalies
