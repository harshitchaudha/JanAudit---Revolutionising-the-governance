"""
Drafting Agent — RTI Application Generation.
Combines anomaly data and RAG legal references into a structured,
formal RTI application draft.
"""

from datetime import datetime
from typing import Dict, List, Optional

from agents.rag import get_legal_context


def generate_rti_draft(
    anomaly: Dict,
    record: Dict,
    document: Dict,
    legal_sections: Optional[List[Dict]] = None
) -> str:
    """
    Generate a structured RTI application draft for a detected anomaly.
    
    Args:
        anomaly: Anomaly dict with type, description, confidence
        record: Financial record dict
        document: Document metadata dict
        legal_sections: Optional pre-fetched legal sections; fetched if None
    
    Returns:
        Formatted RTI application text
    """
    if legal_sections is None:
        legal_sections = get_legal_context(
            anomaly.get("description", ""),
            anomaly.get("anomalyType", "")
        )

    today = datetime.now().strftime("%d %B %Y")
    
    # Build legal references text
    legal_refs = ""
    if legal_sections:
        legal_refs = "\n".join(
            f"  - {s['section']}" for s in legal_sections
        )
    else:
        legal_refs = "  - Section 6, Right to Information Act, 2005"

    draft = f"""RIGHT TO INFORMATION APPLICATION
Under Section 6(1) of the Right to Information Act, 2005
═══════════════════════════════════════════════════════════

Date: {today}

To,
The Public Information Officer,
{document.get('sourceDepartment', '[Department Name]')},
[Office Address],
[City, State - PIN Code]

Subject: Request for Information regarding {record.get('projectName', '[Project/Scheme Name]')}
         under {record.get('category', '[Category]')}

Reference: Document — {document.get('fileName', '[Document Reference]')}

═══════════════════════════════════════════════════════════

Respected Sir/Madam,

I, the undersigned, a citizen of India, hereby seek the following information
under Section 6(1) of the Right to Information Act, 2005:

INFORMATION SOUGHT:
───────────────────

1. Detailed breakdown of the expenditure of ₹{record.get('amount', 0):,.2f} reported
   under "{record.get('projectName', '[Project Name]')}" in the document
   "{document.get('fileName', '[Document]')}".

2. Copies of all sanction orders, utilization certificates, and audited
   statements related to this expenditure.

3. Details of the implementing agency/contractor and the process followed
   for selection (tendering/bidding details if applicable).

4. Timeline of fund disbursement and physical progress reports.

BASIS FOR REQUEST:
──────────────────

The following anomaly has been identified through analysis of publicly
available financial data:

  Type: {anomaly.get('anomalyType', 'Unspecified')}
  
  Details: {anomaly.get('description', 'No details available.')}
  
  Confidence Level: {_confidence_label(anomaly.get('confidenceScore', 0))}

LEGAL BASIS:
────────────

This application is filed under the provisions of the RTI Act, 2005,
specifically:

{legal_refs}

DECLARATION:
────────────

I hereby declare that:
(a) I am a citizen of India.
(b) This information is sought in public interest for promoting
    transparency and accountability in public expenditure.
(c) I am willing to pay the prescribed fee as applicable under
    the RTI Act, 2005.

Please provide the above information within 30 days as stipulated
under Section 7(1) of the RTI Act, 2005.

Thanking you,

Yours faithfully,

[Applicant Name]
[Address]
[Contact Number]
[Email Address]

═══════════════════════════════════════════════════════════
Note: Application fee of ₹10/- is enclosed herewith.
(Mode of payment: [IPO/DD/Court Fee Stamp/Online])
═══════════════════════════════════════════════════════════
"""
    return draft.strip()


def _confidence_label(score: float) -> str:
    """Convert confidence score to human-readable label."""
    if score >= 0.8:
        return f"High ({score:.0%})"
    elif score >= 0.5:
        return f"Medium ({score:.0%})"
    else:
        return f"Low ({score:.0%})"
