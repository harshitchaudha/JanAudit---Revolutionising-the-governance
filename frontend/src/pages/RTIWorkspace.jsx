import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import './RTIWorkspace.css';

const RTI_LANGUAGES = [
    { value: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
    { value: 'hi', label: '🇮🇳 हिन्दी', flag: '🇮🇳' },
];

// ── Hindi RTI draft template ────────────────────────────────────────
function generateHindiDraft(anomaly) {
    if (!anomaly) return '';
    const desc = anomaly.description || '';
    const rec = anomaly.record || {};
    return `सेवा में,
जन सूचना अधिकारी,
${rec.department || '[विभाग का नाम]'}

विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत आवेदन

महोदय/महोदया,

मैं, अधोहस्ताक्षरी, राज्य लेखा परीक्षा प्रतिवेदन वित्तीय वर्ष 2023-24 में दर्ज व्यय के संबंध में निम्नलिखित सूचना प्राप्त करना चाहता/चाहती हूँ:

परियोजना: ${rec.projectName || '[परियोजना का नाम]'}
वाउचर सं.: ${rec.voucherNo || '[वाउचर संख्या]'}
श्रेणी: ${rec.category || '[श्रेणी]'}
राशि: ₹${rec.amount ? (rec.amount / 100000).toFixed(2) + ' लाख' : '[राशि]'}

विसंगति का प्रकार: ${anomaly.anomalyType || '[प्रकार]'}

विवरण:
${desc}

मैं निम्नलिखित सूचना की प्रतियाँ प्राप्त करना चाहता/चाहती हूँ:

1. उक्त परियोजना से संबंधित सभी स्वीकृति आदेश, संशोधित अनुमान एवं वित्त विभाग की अनुमतियों की प्रतियाँ।
2. मूल स्वीकृत बजट से अधिक किए गए व्यय का विस्तृत विवरण।
3. लेखा परीक्षा पैरा के उत्तर में महालेखाकार कार्यालय को प्रस्तुत कार्रवाई प्रतिवेदन (ATR)।
4. इस परियोजना से जुड़े सभी निविदा दस्तावेज़ एवं कार्य आदेश।

उपरोक्त सूचना सूचना का अधिकार अधिनियम, 2005 की धारा 7(1) के अनुसार 30 दिनों के भीतर प्रदान की जाए।

भवदीय,
[आवेदक का नाम]
[दिनांक]
[पता]`;
}

function generateEnglishDraft(anomaly) {
    if (!anomaly) return '';
    const desc = anomaly.description || '';
    const rec = anomaly.record || {};
    return `To,
The Public Information Officer,
${rec.department || '[Department Name]'}

Sub: Application under Section 6(1) of the Right to Information Act, 2005

Sir/Madam,

I, the undersigned, wish to seek the following information regarding the expenditure reported in the State Audit Report FY 2023-24:

Project: ${rec.projectName || '[Project Name]'}
Voucher No.: ${rec.voucherNo || '[Voucher Number]'}
Category: ${rec.category || '[Category]'}
Amount: ₹${rec.amount ? (rec.amount / 100000).toFixed(2) + ' Lakh' : '[Amount]'}

Anomaly Type: ${anomaly.anomalyType || '[Type]'}

Description:
${desc}

I wish to obtain the following information:

1. Copies of all sanction orders, revised estimates, and Finance Department approvals for the said project.
2. Details of the expenditure incurred in excess of the original sanctioned budget.
3. Action taken report (ATR) submitted to the Accountant General's office in response to the audit para.
4. All tender documents and work orders associated with this project.

The above information may be provided within 30 days as stipulated under Section 7(1) of the RTI Act, 2005.

Yours faithfully,
[Applicant Name]
[Date]
[Address]`;
}

export default function RTIWorkspace() {
    const location = useLocation();

    // STATE
    const [anomalies, setAnomalies] = useState([]);
    const [selectedAnomalyId, setSelectedAnomalyId] = useState(location.state?.anomalyId || '');
    const [draftContent, setDraftContent] = useState('');
    const [legalSections, setLegalSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [draftLang, setDraftLang] = useState('en');

    // LOAD INITIAL DATA
    useEffect(() => {
        api.getAnomalies().then(setAnomalies).catch((e) => console.error("Anomaly load failed:", e));
        api.getDrafts().then(setDrafts).catch((e) => console.error("Draft load failed:", e));
    }, []);

    // LOAD LEGAL CONTEXT WHEN USER SELECTS ANOMALY
    useEffect(() => {
        if (!selectedAnomalyId) return;

        const anomaly = anomalies.find(a => a.id === selectedAnomalyId);
        if (!anomaly) return;

        api.getLegalContext(anomaly.description)
            .then((res) => setLegalSections(res.sections || []))
            .catch((e) => {
                console.error("Failed to load legal context:", e);
                setLegalSections([]);
            });
    }, [selectedAnomalyId, anomalies]);

    // GENERATE RTI DRAFT (bilingual)
    const handleGenerate = async () => {
        if (!selectedAnomalyId) return alert("Please select an anomaly.");

        setLoading(true);
        try {
            // Try real backend first
            const result = await api.generateDraft(selectedAnomalyId, draftLang);

            if (result && result.draftContent) {
                setDraftContent(result.draftContent);
            } else {
                // Fallback: generate locally from anomaly data
                const anomaly = anomalies.find(a => a.id === selectedAnomalyId);
                const draft = draftLang === 'hi'
                    ? generateHindiDraft(anomaly)
                    : generateEnglishDraft(anomaly);
                setDraftContent(draft);
            }

            // Refresh previous drafts
            const updatedDrafts = await api.getDrafts();
            setDrafts(updatedDrafts);
        } catch {
            // Fallback: generate locally
            const anomaly = anomalies.find(a => a.id === selectedAnomalyId);
            const draft = draftLang === 'hi'
                ? generateHindiDraft(anomaly)
                : generateEnglishDraft(anomaly);
            setDraftContent(draft);
        } finally {
            setLoading(false);
        }
    };

    // EXPORT DRAFT AS TXT
    const handleExport = () => {
        const blob = new Blob([draftContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const suffix = draftLang === 'hi' ? '_Hindi' : '_English';
        a.download = `RTI_Application${suffix}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="rti-page container">
            <h1 className="page-title animate-in">📝 RTI Workspace</h1>
            <p className="page-subtitle animate-in stagger-1">
                Generate legally compliant Right to Information applications
            </p>

            <div className="rti-layout animate-in stagger-2">

                {/* LEFT LEGAL SIDEBAR */}
                <aside className="legal-pane card">
                    <h2 className="pane-title">📚 Legal References</h2>
                    <p className="pane-subtitle">RTI Act, 2005 — Relevant Sections</p>

                    {legalSections.length === 0 ? (
                        <div className="legal-empty">
                            <p>Select an anomaly to load relevant legal sections.</p>
                        </div>
                    ) : (
                        <div className="legal-sections">
                            {legalSections.map((section, idx) => (
                                <div key={idx} className="legal-section">
                                    <div className="legal-section-header">
                                        <span className="legal-section-name">{section.section}</span>

                                        {/* CRASH-PROOF SAFE NUMBER RENDERING */}
                                        <span className="relevance-score">
                                            {typeof section.relevance_score === "number"
                                                ? section.relevance_score.toFixed(1)
                                                : "N/A"}
                                        </span>
                                    </div>
                                    <p className="legal-section-content">{section.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                {/* MAIN EDITOR AREA */}
                <main className="editor-pane">

                    {/* ANOMALY SELECTOR + LANGUAGE */}
                    <div className="anomaly-selector card">
                        <label className="selector-label">Select Anomaly</label>
                        <select
                            className="selector-select"
                            value={selectedAnomalyId}
                            onChange={(e) => setSelectedAnomalyId(e.target.value)}
                        >
                            <option value="">-- Choose an anomaly --</option>
                            {anomalies.map((a) => (
                                <option key={a.id} value={a.id}>
                                    [{a.anomalyType}] {a.description?.slice(0, 80)}...
                                </option>
                            ))}
                        </select>

                        {/* Language selector */}
                        <label className="selector-label" style={{ marginTop: '14px' }}>Draft Language / भाषा चुनें</label>
                        <div className="rti-lang-toggle">
                            {RTI_LANGUAGES.map(l => (
                                <button
                                    key={l.value}
                                    type="button"
                                    className={`rti-lang-btn ${draftLang === l.value ? 'active' : ''}`}
                                    onClick={() => setDraftLang(l.value)}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>

                        <div className="selector-actions">
                            <button
                                className="btn btn-primary"
                                disabled={!selectedAnomalyId || loading}
                                onClick={handleGenerate}
                            >
                                {loading ? "⏳ Generating..." : "🤖 Generate RTI Draft"}
                            </button>
                        </div>
                    </div>

                    {/* EDITOR */}
                    <div className="draft-editor card">
                        <div className="editor-header">
                            <h2>Document Editor</h2>
                            <div className="editor-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleGenerate}
                                    disabled={!selectedAnomalyId || loading}
                                >
                                    🔄 Regenerate
                                </button>
                                <button
                                    className="btn btn-primary"
                                    disabled={!draftContent}
                                    onClick={handleExport}
                                >
                                    📥 Export to TXT
                                </button>
                            </div>
                        </div>

                        <textarea
                            className="draft-textarea"
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            placeholder={draftLang === 'hi' ? "उत्पन्न RTI ड्राफ्ट यहाँ दिखाई देगा..." : "Generated RTI draft will appear here..."}
                            rows={24}
                        />
                    </div>

                    {/* PREVIOUS DRAFTS */}
                    {drafts.length > 0 && (
                        <div className="previous-drafts card">
                            <h3>📋 Previous Drafts</h3>
                            <div className="drafts-list">
                                {drafts.map((d) => (
                                    <div
                                        key={d.id}
                                        className="draft-item"
                                        onClick={() => setDraftContent(d.draftContent)}
                                    >
                                        <span className="draft-date">
                                            {new Date(d.generatedDate).toLocaleString()}
                                        </span>
                                        <span className="draft-preview">
                                            {d.draftContent?.slice(0, 60)}...
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}