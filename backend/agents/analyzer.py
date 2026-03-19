"""
Analyzer Agent — Context-rich, meaningful anomaly detection
"""

import numpy as np
import uuid
from difflib import SequenceMatcher


def detect_anomalies(records):
    if not records:
        return []

    anomalies = []
    amounts = [r["amount"] for r in records]

    anomalies += _statistical_outlier(records, amounts)
    anomalies += _iqr_outlier(records, amounts)
    anomalies += _duplicate_entries(records)
    anomalies += _budget_overrun(records)
    anomalies += _suspicious_round_amount(records, amounts)
    anomalies += _zero_or_invalid(records)

    # De-duplicate: keep highest confidence per (recordId, anomalyType)
    seen = {}
    for a in anomalies:
        key = (a["recordId"], a["anomalyType"])
        if key not in seen or a["confidenceScore"] > seen[key]["confidenceScore"]:
            seen[key] = a

    return list(seen.values())


# ─────────────────────────────────────────────
# 1. STATISTICAL OUTLIER  (Z-score > 3)
# ─────────────────────────────────────────────
def _statistical_outlier(records, amounts):
    """
    Flags items whose expenditure is unusually high compared to all other
    items in the same document. Threshold raised to 3σ to avoid noise.
    """
    if len(amounts) < 5:
        return []

    arr = np.array(amounts, dtype=float)
    mean, std = arr.mean(), arr.std()
    if std == 0:
        return []

    anomalies = []
    for i, r in enumerate(records):
        z = abs((r["amount"] - mean) / std)
        if z > 3:
            times_more = r["amount"] / mean
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Statistical Outlier",
                "description": (
                    f"'{r['projectName']}' has an expenditure of ₹{r['amount']:,.0f}, "
                    f"which is {times_more:.1f}x the average spending (₹{mean:,.0f}) "
                    f"across all items in this report ({z:.1f} standard deviations above mean). "
                    f"This level of spending is statistically unusual and warrants verification."
                ),
                "confidenceScore": round(min(0.5 + (z - 3) * 0.1, 0.99), 2),
            })
    return anomalies


# ─────────────────────────────────────────────
# 2. IQR OUTLIER
# ─────────────────────────────────────────────
def _iqr_outlier(records, amounts):
    """
    Flags items outside 1.5× IQR range — a robust outlier method
    less affected by extreme values than Z-score.
    """
    if len(amounts) < 6:
        return []

    arr = np.array(amounts, dtype=float)
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    if iqr == 0:
        return []

    upper = q3 + 1.5 * iqr
    lower = max(q1 - 1.5 * iqr, 0)

    anomalies = []
    for r in records:
        amt = r["amount"]
        if amt > upper:
            excess = amt - upper
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "IQR Outlier",
                "description": (
                    f"'{r['projectName']}' (Category: {r.get('category','General')}) "
                    f"spent ₹{amt:,.0f}, which is ₹{excess:,.0f} above the expected "
                    f"upper limit of ₹{upper:,.0f} for this report. "
                    f"75% of all items cost less than ₹{q3:,.0f}. "
                    f"This expenditure is disproportionately high relative to peers."
                ),
                "confidenceScore": round(min(0.55 + (amt - upper) / upper * 0.3, 0.95), 2),
            })
        elif amt < lower and lower > 0:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "IQR Outlier",
                "description": (
                    f"'{r['projectName']}' has an unusually low expenditure of ₹{amt:,.0f}, "
                    f"below the expected lower bound of ₹{lower:,.0f}. "
                    f"This may indicate underspending or incomplete reporting."
                ),
                "confidenceScore": 0.5,
            })
    return anomalies


# ─────────────────────────────────────────────
# 3. DUPLICATE ENTRY DETECTION
# ─────────────────────────────────────────────
def _duplicate_entries(records):
    """
    Detects entries with identical or near-identical names and amounts —
    a common sign of double-booking or data entry errors.
    """
    anomalies = []
    flagged = set()

    for i, r1 in enumerate(records):
        for j, r2 in enumerate(records):
            if i >= j:
                continue
            if (r1["id"], r2["id"]) in flagged:
                continue

            name_sim = SequenceMatcher(None, r1["projectName"].lower(), r2["projectName"].lower()).ratio()
            same_amount = abs(r1["amount"] - r2["amount"]) < 1.0

            if name_sim > 0.85 and same_amount:
                flagged.add((r1["id"], r2["id"]))
                anomalies.append({
                    "id": str(uuid.uuid4()),
                    "recordId": r1["id"],
                    "anomalyType": "Duplicate Entry Discrepancy",
                    "description": (
                        f"'{r1['projectName']}' (₹{r1['amount']:,.0f}) appears to be a "
                        f"duplicate of '{r2['projectName']}' (₹{r2['amount']:,.0f}). "
                        f"Both entries have {int(name_sim*100)}% name similarity and identical amounts. "
                        f"This could indicate double-booking or an accounting error."
                    ),
                    "confidenceScore": round(0.6 + name_sim * 0.35, 2),
                })
                anomalies.append({
                    "id": str(uuid.uuid4()),
                    "recordId": r2["id"],
                    "anomalyType": "Duplicate Entry Discrepancy",
                    "description": (
                        f"'{r2['projectName']}' (₹{r2['amount']:,.0f}) appears to be a "
                        f"duplicate of '{r1['projectName']}' (₹{r1['amount']:,.0f}). "
                        f"Both entries have {int(name_sim*100)}% name similarity and identical amounts. "
                        f"This could indicate double-booking or an accounting error."
                    ),
                    "confidenceScore": round(0.6 + name_sim * 0.35, 2),
                })

    return anomalies


# ─────────────────────────────────────────────
# 4. BUDGET OVERRUN
# ─────────────────────────────────────────────
def _budget_overrun(records):
    """
    Flags items where actual expenditure exceeds the sanctioned budget
    provision — a key indicator of financial irregularity.
    """
    anomalies = []
    for r in records:
        budget = r.get("budgetProvision", 0) or 0
        actual = r["amount"]

        if budget > 0 and actual > budget:
            overrun = actual - budget
            pct = (overrun / budget) * 100
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Budget Overrun",
                "description": (
                    f"'{r['projectName']}' exceeded its sanctioned budget. "
                    f"Budget provision: ₹{budget:,.0f} | Actual expenditure: ₹{actual:,.0f} | "
                    f"Overrun: ₹{overrun:,.0f} ({pct:.1f}% over budget). "
                    f"Expenditure beyond sanctioned amounts requires prior approval under GFR rules."
                ),
                "confidenceScore": round(min(0.65 + pct / 200, 0.98), 2),
            })
    return anomalies


# ─────────────────────────────────────────────
# 5. SUSPICIOUS ROUND AMOUNTS
# ─────────────────────────────────────────────
def _suspicious_round_amount(records, amounts):
    """
    Flags very large perfectly round amounts. In real expenditure,
    exact round crore/lakh figures are rare and may indicate estimated
    or fabricated entries — especially above ₹10 lakh.
    """
    if not amounts:
        return []

    mean_amount = np.mean(amounts)
    anomalies = []

    for r in records:
        amt = r["amount"]
        # Only flag if: above ₹10L, is a round figure, AND is large relative to mean
        is_round = amt >= 1_000_000 and amt % 100_000 == 0
        is_large = amt > mean_amount * 2

        if is_round and is_large:
            lakhs = amt / 100_000
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Suspicious Round Amount",
                "description": (
                    f"'{r['projectName']}' has a perfectly round expenditure of "
                    f"₹{lakhs:,.0f} lakh (₹{amt:,.0f}). "
                    f"Round-figure amounts in large expenditures are uncommon in real procurement "
                    f"and may indicate estimated, pre-approved, or potentially fabricated entries. "
                    f"Actual invoiced amounts are rarely exact round figures."
                ),
                "confidenceScore": 0.55,
            })
    return anomalies


# ─────────────────────────────────────────────
# 6. ZERO OR INVALID AMOUNT
# ─────────────────────────────────────────────
def _zero_or_invalid(records):
    anomalies = []
    for r in records:
        if r["amount"] <= 0:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Invalid Amount",
                "description": (
                    f"'{r['projectName']}' has a recorded expenditure of ₹0 or a negative value. "
                    f"This likely indicates a data entry error, a failed transaction, "
                    f"or an item that was approved but not executed."
                ),
                "confidenceScore": 0.85,
            })
    return anomalies