import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import './RTIWorkspace.css';

export default function RTIWorkspace() {
    const location = useLocation();
    const [anomalies, setAnomalies] = useState([]);
    const [selectedAnomalyId, setSelectedAnomalyId] = useState(location.state?.anomalyId || '');
    const [draftContent, setDraftContent] = useState('');
    const [legalSections, setLegalSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drafts, setDrafts] = useState([]);

    useEffect(() => {
        api.getAnomalies().then(setAnomalies).catch(console.error);
        api.getDrafts().then(setDrafts).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedAnomalyId) {
            const a = anomalies.find(x => x.id === selectedAnomalyId);
            if (a) {
                api.getLegalContext(a.description).then(res => setLegalSections(res.sections || [])).catch(console.error);
            }
        }
    }, [selectedAnomalyId, anomalies]);

    const handleGenerate = async () => {
        if (!selectedAnomalyId) return;
        setLoading(true);
        try {
            const result = await api.generateDraft(selectedAnomalyId);
            setDraftContent(result.draftContent);
            const updated = await api.getDrafts();
            setDrafts(updated);
        } catch (err) {
            console.error(err);
            alert('Failed to generate draft: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const blob = new Blob([draftContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'RTI_Application_Draft.txt';
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
                {/* Legal Reference Pane */}
                <aside className="legal-pane card">
                    <h2 className="pane-title">📚 Legal References</h2>
                    <p className="pane-subtitle">RTI Act, 2005 — Relevant Sections</p>

                    {legalSections.length === 0 ? (
                        <div className="legal-empty">
                            <p>Select an anomaly to load relevant legal provisions.</p>
                        </div>
                    ) : (
                        <div className="legal-sections">
                            {legalSections.map((s, i) => (
                                <div key={i} className="legal-section">
                                    <div className="legal-section-header">
                                        <span className="legal-section-name">{s.section}</span>
                                        <span className="relevance-score">{s.relevance_score.toFixed(1)}</span>
                                    </div>
                                    <p className="legal-section-content">{s.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Main Editor Area */}
                <main className="editor-pane">
                    {/* Anomaly Selector */}
                    <div className="anomaly-selector card">
                        <label className="selector-label">Select Anomaly</label>
                        <select
                            className="selector-select"
                            value={selectedAnomalyId}
                            onChange={(e) => setSelectedAnomalyId(e.target.value)}
                        >
                            <option value="">-- Choose an anomaly --</option>
                            {anomalies.map(a => (
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
                                {loading ? '⏳ Generating...' : '🤖 Generate RTI Draft'}
                            </button>
                        </div>
                    </div>

                    {/* Draft Editor */}
                    <div className="draft-editor card">
                        <div className="editor-header">
                            <h2>Document Editor</h2>
                            <div className="editor-actions">
                                <button className="btn btn-secondary" onClick={handleGenerate} disabled={!selectedAnomalyId || loading}>
                                    🔄 Regenerate
                                </button>
                                <button className="btn btn-primary" onClick={handleExport} disabled={!draftContent}>
                                    📥 Export to TXT
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="draft-textarea"
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            placeholder="Select an anomaly and click 'Generate RTI Draft' to create a legally compliant RTI application..."
                            rows={24}
                        />
                    </div>

                    {/* Previous Drafts */}
                    {drafts.length > 0 && (
                        <div className="previous-drafts card">
                            <h3>📋 Previous Drafts</h3>
                            <div className="drafts-list">
                                {drafts.map(d => (
                                    <div key={d.id} className="draft-item" onClick={() => setDraftContent(d.draftContent)}>
                                        <span className="draft-date">{new Date(d.generatedDate).toLocaleString()}</span>
                                        <span className="draft-preview">{d.draftContent?.slice(0, 60)}...</span>
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
