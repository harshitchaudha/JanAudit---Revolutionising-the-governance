import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import './RTIWorkspace.css';

export default function RTIWorkspace() {
    const location = useLocation();

    // STATE
    const [anomalies, setAnomalies] = useState([]);
    const [selectedAnomalyId, setSelectedAnomalyId] = useState(location.state?.anomalyId || '');
    const [draftContent, setDraftContent] = useState('');
    const [legalSections, setLegalSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drafts, setDrafts] = useState([]);

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

    // GENERATE RTI DRAFT
    const handleGenerate = async () => {
        if (!selectedAnomalyId) return alert("Please select an anomaly.");

        setLoading(true);
        try {
            const result = await api.generateDraft(selectedAnomalyId);
            setDraftContent(result.draftContent);

            // Refresh previous drafts
            const updatedDrafts = await api.getDrafts();
            setDrafts(updatedDrafts);
        } catch (err) {
            console.error(err);
            alert("Failed to generate RTI draft.");
        } finally {
            setLoading(false);
        }
    };

    // EXPORT DRAFT AS TXT
    const handleExport = () => {
        const blob = new Blob([draftContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "RTI_Application_Draft.txt";
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

                    {/* ANOMALY SELECTOR */}
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
                            placeholder="Generated RTI draft will appear here..."
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