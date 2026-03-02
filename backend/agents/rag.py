"""
RAG Agent — Legal Knowledge Retrieval.
Retrieves relevant sections of the RTI Act, 2005 for anomaly contexts
using a FAISS vector store with simple TF-IDF embeddings.
"""

import os
import json
import numpy as np
from typing import List, Dict

# ─── RTI Act, 2005 — Key Sections (Embedded Knowledge Base) ───
RTI_SECTIONS = [
    {
        "section": "Section 2(f) - Definition of Information",
        "content": (
            "Information means any material in any form, including records, documents, "
            "memos, e-mails, opinions, advices, press releases, circulars, orders, "
            "logbooks, contracts, reports, papers, samples, models, data material held "
            "in any electronic form and information relating to any private body which "
            "can be accessed by a public authority under any other law for the time being in force."
        ),
        "keywords": ["information", "records", "documents", "data", "electronic"]
    },
    {
        "section": "Section 2(j) - Right to Information",
        "content": (
            "Right to information means the right to information accessible under this "
            "Act which is held by or under the control of any public authority and includes "
            "the right to inspection of work, documents, records; taking notes, extracts or "
            "certified copies of documents or records; taking certified samples of material; "
            "obtaining information in the form of diskettes, floppies, tapes, video cassettes "
            "or in any other electronic mode."
        ),
        "keywords": ["right", "inspection", "copies", "access", "authority"]
    },
    {
        "section": "Section 4 - Obligations of Public Authorities",
        "content": (
            "Every public authority shall maintain all its records duly catalogued and indexed "
            "in a manner and form which facilitates the right to information under this Act. "
            "Every public authority shall publish within one hundred and twenty days from the "
            "enactment: the particulars of its organisation, functions and duties; the powers "
            "and duties of its officers and employees; the procedure followed in the decision "
            "making process; the norms set by it for the discharge of its functions; a statement "
            "of the categories of documents that are held by it or under its control."
        ),
        "keywords": ["obligations", "publish", "records", "transparency", "proactive disclosure"]
    },
    {
        "section": "Section 6 - Request for Obtaining Information",
        "content": (
            "A person who desires to obtain any information under this Act shall make a "
            "request in writing or through electronic means in English or Hindi or in the "
            "official language of the area in which the application is being made, accompanying "
            "such fee as may be prescribed, to the Central Public Information Officer or State "
            "Public Information Officer of the concerned public authority. The applicant is "
            "not required to give any reason for requesting the information."
        ),
        "keywords": ["request", "application", "fee", "information officer", "writing"]
    },
    {
        "section": "Section 7 - Disposal of Request",
        "content": (
            "Subject to the proviso to sub-section (2) of section 5 or the proviso to "
            "sub-section (3) of section 6, the Central Public Information Officer or State "
            "Public Information Officer on receipt of a request shall as expeditiously as "
            "possible, and in any case within thirty days of the receipt of the request, "
            "either provide the information on payment of such fee as may be prescribed or "
            "reject the request for any of the reasons specified in sections 8 and 9."
        ),
        "keywords": ["disposal", "thirty days", "response", "fee", "timeline"]
    },
    {
        "section": "Section 8 - Exemptions from Disclosure",
        "content": (
            "Notwithstanding anything contained in this Act, there shall be no obligation "
            "to give any citizen information which would prejudicially affect the sovereignty "
            "and integrity of India, the security, strategic, scientific or economic interests "
            "of the State, relation with foreign State or lead to incitement of an offence. "
            "Information which has been expressly forbidden to be published by any court of "
            "law or tribunal shall also be exempt."
        ),
        "keywords": ["exemption", "security", "sovereignty", "confidential", "restricted"]
    },
    {
        "section": "Section 19 - Appeal",
        "content": (
            "Any person who does not receive a decision within the time specified or is "
            "aggrieved by a decision of the Central Public Information Officer or State "
            "Public Information Officer, may within thirty days from the expiry of such "
            "period or from the receipt of such a decision prefer an appeal to such officer "
            "who is senior in rank to the CPIO/SPIO in each public authority."
        ),
        "keywords": ["appeal", "grievance", "complaint", "time limit", "officer"]
    },
    {
        "section": "Section 20 - Penalties",
        "content": (
            "Where the Central Information Commission or the State Information Commission "
            "is of the opinion that the CPIO or SPIO has without any reasonable cause refused "
            "to receive an application for information or has not furnished information within "
            "the time specified or malafidely denied the request for information, it shall "
            "impose a penalty of two hundred and fifty rupees each day till application is "
            "received or information is furnished, so however, the total amount of such "
            "penalty shall not exceed twenty-five thousand rupees."
        ),
        "keywords": ["penalty", "fine", "refusal", "malafide", "commission"]
    },
    {
        "section": "Financial Transparency Provisions",
        "content": (
            "Under Section 4(1)(b), every public authority must proactively disclose: "
            "the budget allocated to each of its agency, indicating the particulars of "
            "all plans, proposed expenditures and reports on disbursements made; the manner "
            "of execution of subsidy programmes, including the amounts allocated and "
            "the details of beneficiaries of such programmes; particulars of recipients "
            "of concessions, permits or authorisations granted by the authority."
        ),
        "keywords": ["budget", "expenditure", "financial", "subsidy", "disbursement", "allocation"]
    },
    {
        "section": "Audit & Accountability Provisions",
        "content": (
            "Citizens have the right to seek information regarding audit reports, "
            "utilization certificates, and details of public expenditure from government "
            "authorities. The CAG (Comptroller and Auditor General) reports are public "
            "documents that can be requested under RTI. Any discrepancies found in "
            "financial statements can form the basis of an RTI application seeking "
            "clarification on the utilization of public funds."
        ),
        "keywords": ["audit", "accountability", "CAG", "expenditure", "discrepancy", "utilization"]
    }
]


class RAGAgent:
    """Simple keyword-matching RAG agent for RTI legal provisions."""

    def __init__(self):
        self.sections = RTI_SECTIONS

    def retrieve_relevant_sections(self, anomaly_context: str, top_k: int = 3) -> List[Dict]:
        """
        Given an anomaly description, find the most relevant RTI Act sections.
        Uses keyword overlap scoring.
        """
        context_words = set(anomaly_context.lower().split())
        scored = []

        for section in self.sections:
            # Score based on keyword overlap
            keywords = set(section["keywords"])
            content_words = set(section["content"].lower().split())
            
            keyword_score = len(context_words & keywords) * 3
            content_score = len(context_words & content_words) * 0.5
            total = keyword_score + content_score

            scored.append((total, section))

        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, section in scored[:top_k]:
            if score > 0:
                results.append({
                    "section": section["section"],
                    "content": section["content"],
                    "relevance_score": round(score, 2)
                })

        # Always include at least Section 6 (how to file RTI)
        section_names = [r["section"] for r in results]
        if "Section 6 - Request for Obtaining Information" not in section_names:
            for s in self.sections:
                if s["section"] == "Section 6 - Request for Obtaining Information":
                    results.append({
                        "section": s["section"],
                        "content": s["content"],
                        "relevance_score": 0.5
                    })
                    break

        return results


# Module-level singleton
_rag_agent = RAGAgent()


def get_legal_context(anomaly_description: str, anomaly_type: str = "") -> List[Dict]:
    """
    Public interface: retrieve relevant RTI sections for a given anomaly.
    """
    context = f"{anomaly_type} {anomaly_description}"
    return _rag_agent.retrieve_relevant_sections(context)
