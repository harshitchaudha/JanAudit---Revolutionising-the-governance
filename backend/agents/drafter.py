"""
Drafting Agent — Generates RTI Application.
Creates a clean, official RTI draft using anomaly + financial record + legal references.
"""

from datetime import datetime
from typing import Dict, List, Optional


def generate_rti_draft(
    anomaly: Dict,
    record: Dict,
    document: Dict,
    legal_sections: Optional[List[Dict]] = None
) -> str:
    """
    Generate a structured RTI application.
    """

    today = datetime.now().strftime("%d %B %Y")

    anomaly_type = anomaly.get("anomalyType", "Unknown Issue")
    anomaly_desc = anomaly.get("description", "No description available")
    confidence = anomaly.get("confidenceScore", 0)

    amount = record.get("amount", 0)
    projectName = record.get("projectName", "Unknown Project")
    category = record.get("category", "General")

    department = document.get("sourceDepartment", "Unknown Department")
    fileName = document.get("fileName", "Uploaded Document")

    # Build legal references
    if legal_sections:
        legal_ref_block = "\n".join([f"  • {l['section']}" for l in legal_sections])
    else:
        legal_ref_block = "  • Section 6(1), Right to Information Act, 2005"

    # Confidence label
    if confidence >= 0.8:
        conf_label = f"High ({confidence:.0%})"
    elif confidence >= 0.5:
        conf_label = f"Medium ({confidence:.0%})"
    else:
        conf_label = f"Low ({confidence:.0%})"

    # ==========================================================
    # FINAL RTI APPLICATION
    # ==========================================================

    draft = f"""
RIGHT TO INFORMATION APPLICATION  
Under Section 6(1) of the Right to Information Act, 2005  
===========================================================

Date: {today}

To,  
The Public Information Officer  
{department}  
[Office Address]  
[City, District – PIN]

Subject: Seeking Information related to expenditure under "{projectName}"

Reference: Financial document "{fileName}"

-----------------------------------------------------------
REQUEST FOR INFORMATION
-----------------------------------------------------------

I kindly request the following information under Section 6(1)
of the RTI Act, 2005 regarding the expenditure of ₹{amount:,.2f}
reported under the project/category "{projectName}" ({category}):

1. A complete and itemized breakdown of the expenditure amounting to  
   ₹{amount:,.2f}, including all sub-heads and supporting records.

2. Copies of:
   - Sanction orders  
   - Fund release orders  
   - Work orders / tender documents  
   - Utilization certificates  
   - Audited financial statements  

3. Details of the implementing agency / contractor,  
   along with bidding process details (if applicable).

4. Status of physical progress/work completion related to funds used.

-----------------------------------------------------------
REASON FOR SEEKING INFORMATION
-----------------------------------------------------------

During analysis, the following anomaly was detected:

• **Type:** {anomaly_type}  
• **Details:** {anomaly_desc}  
• **Confidence Level:** {conf_label}

The presence of this anomaly indicates possible misreporting,
duplication, or irregularity in public expenditure.  
As a citizen, I seek this information to promote transparency 
and ensure accountability in public spending.

-----------------------------------------------------------
LEGAL BASIS
-----------------------------------------------------------

This request is filed under the following provisions:

{legal_ref_block}

-----------------------------------------------------------
DECLARATION
-----------------------------------------------------------

I am an Indian citizen seeking this information in public interest.  
I agree to pay requisite fees as applicable under the RTI Act, 2005.

Kindly provide the requested information within 30 days as mandated  
under Section 7(1) of the RTI Act.

Thank you.

Yours faithfully,  
[Applicant Name]  
[Address]  
[Phone]  
[Email]

(Enclosed: ₹10 RTI fee via IPO/DD/Online Payment)
===========================================================
"""
    return draft.strip()