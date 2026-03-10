"""
Analyzer Agent — Stable anomaly detection
"""

import numpy as np
import uuid


def detect_anomalies(records):
    if not records:
        return []

    anomalies = []
    amounts = [r["amount"] for r in records]

    anomalies += _z(records, amounts)
    anomalies += _iqr(records, amounts)
    anomalies += _rules(records)

    # remove duplicates
    final = {}
    for a in anomalies:
        final[(a["recordId"], a["anomalyType"])] = a

    return list(final.values())


def _z(records, amounts):
    if len(amounts) < 3:
        return []

    arr = np.array(amounts)
    mean, std = arr.mean(), arr.std()
    if std == 0:
        return []

    anomalies = []
    zscores = abs((arr - mean) / std)

    for i, z in enumerate(zscores):
        if z > 2:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": records[i]["id"],
                "anomalyType": "Statistical Outlier",
                "description": f"Amount ₹{records[i]['amount']:,} is {z:.1f}σ from mean.",
                "confidenceScore": min(z / 4, 1),
            })
    return anomalies


def _iqr(records, amounts):
    if len(amounts) < 4:
        return []

    arr = np.array(amounts)
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    if iqr == 0:
        return []

    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    anomalies = []

    for r in records:
        if r["amount"] < low or r["amount"] > high:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "IQR Outlier",
                "description": f"₹{r['amount']:,} outside normal range ({low:,}–{high:,}).",
                "confidenceScore": 0.6,
            })
    return anomalies


def _rules(records):
    anomalies = []

    for r in records:
        amt = r["amount"]

        if amt >= 100000 and str(amt).endswith("0000"):
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Suspicious Round Amount",
                "description": f"₹{amt:,} is a round figure.",
                "confidenceScore": 0.4,
            })

        if amt <= 0:
            anomalies.append({
                "id": str(uuid.uuid4()),
                "recordId": r["id"],
                "anomalyType": "Invalid Amount",
                "description": "Amount is zero or negative.",
                "confidenceScore": 0.8,
            })

    return anomalies