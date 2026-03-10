"""
Appeal Generator — RTI First Appeal & Second Appeal
Creates official appeal letters under Sections 19(1) and 19(3) of the RTI Act, 2005.
"""

from datetime import datetime
from typing import Optional


# ─────────────────────────────────────────────────────────────
# FIRST APPEAL GENERATOR – Section 19(1)
# ─────────────────────────────────────────────────────────────

def generate_first_appeal(
    rti_application_date: str,
    reason: str,
    pio_name: Optional[str] = "Public Information Officer",
    department: Optional[str] = "Relevant Department",
    applicant_name: Optional[str] = "[Your Name]",
) -> str:

    today = datetime.now().strftime("%d %B %Y")

    # Standard reasons expected:
    # - "No response within 30 days"
    # - "Refusal of information"
    # - "Partial information received"
    # - "Misleading or incorrect information"
    # - "Excessive fees demanded"

    reason_block = {
        "no_response": "No response was received within the mandatory 30-day period as required under Section 7(1) of the RTI Act.",
        "refusal": "The Public Information Officer denied the requested information without reasonable justification.",
        "partial": "The information provided was incomplete and not satisfactory.",
        "incorrect": "The information provided appears misleading/incorrect and does not match the requested details.",
        "fees": "Excessive/unjustified fees have been demanded contrary to RTI rules.",
    }

    reason_text = reason_block.get(reason, reason)

    appeal = f"""
RTI FIRST APPEAL  
Under Section 19(1) of the Right to Information Act, 2005  
=========================================================

Date: {today}

To,  
The First Appellate Authority (FAA)  
{department}  
[Office Address]  
[City, District – PIN]

Subject: First Appeal under the RTI Act regarding application dated {rti_application_date}

Sir/Madam,

I, the appellant, hereby submit this First Appeal under Section 19(1)
of the RTI Act, 2005.

-----------------------------------------------------------
DETAILS OF ORIGINAL RTI APPLICATION
-----------------------------------------------------------

• RTI Application Date: {rti_application_date}  
• Addressed To: {pio_name}, {department}

-----------------------------------------------------------
GROUNDS FOR APPEAL
-----------------------------------------------------------

{reason_text}

This action/inaction violates provisions of the RTI Act and
denies my lawful right to access public information.

-----------------------------------------------------------
RELIEF SOUGHT
-----------------------------------------------------------

I request the Hon’ble First Appellate Authority to:

1. Direct the PIO to furnish complete and correct information.  
2. Take appropriate action under Section 20 against the PIO if delay/denial is found intentional.  
3. Ensure transparency and compliance with RTI norms.

-----------------------------------------------------------
DECLARATION
-----------------------------------------------------------

I am an Indian citizen exercising my rights under the RTI Act.

Thanking you,

Yours faithfully,  
{applicant_name}  
[Address]  
[Contact Number]  
[Email]

=========================================================
"""
    return appeal.strip()



# ─────────────────────────────────────────────────────────────
# SECOND APPEAL GENERATOR – Section 19(3)
# ─────────────────────────────────────────────────────────────

def generate_second_appeal(
    first_appeal_date: str,
    department: str = "Relevant Department",
    reason: str = "No satisfactory response received from First Appellate Authority",
    applicant_name: str = "[Your Name]",
) -> str:

    today = datetime.now().strftime("%d %B %Y")

    appeal = f"""
RTI SECOND APPEAL  
Under Section 19(3) of the Right to Information Act, 2005  
=========================================================

Date: {today}

To,  
The Hon’ble State/Central Information Commission  
[Commission Address]  
[City – PIN]

Subject: Second Appeal under the RTI Act regarding First Appeal dated {first_appeal_date}

Sir/Madam,

I hereby submit this Second Appeal under Section 19(3) of the RTI Act, 2005.

-----------------------------------------------------------
CASE BACKGROUND
-----------------------------------------------------------

• RTI Application submitted on: (Date of original RTI application)  
• First Appeal filed on: {first_appeal_date}  
• Department: {department}

-----------------------------------------------------------
GROUNDS FOR SECOND APPEAL
-----------------------------------------------------------

{reason}

This constitutes a violation under RTI Act Sections 7(1), 19(1), and 20,
and reflects non-compliance by the concerned authorities.

-----------------------------------------------------------
RELIEF SOUGHT
-----------------------------------------------------------

I request the Hon’ble Commission to:

1. Direct the PIO/FAA to provide complete and correct information.  
2. Impose penalties under Section 20 for delay, refusal or obstruction.  
3. Order compensation (if applicable) under Section 19(8)(b).  
4. Ensure systemic improvements for compliance with the RTI Act.

-----------------------------------------------------------
DECLARATION
-----------------------------------------------------------

I am an Indian citizen exercising my statutory rights under the RTI Act.

Yours faithfully,  
{applicant_name}  
[Address]  
[Contact Number]  
[Email]

=========================================================
"""
    return appeal.strip()