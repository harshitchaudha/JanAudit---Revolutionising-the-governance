import './About.css';

const AGENTS = [
    { name: 'Auditor Agent', icon: '🔍', desc: 'Extracts text and tabular data from PDF financial documents using OCR and advanced parsing.' },
    { name: 'Analyzer Agent', icon: '🤖', desc: 'Detects statistical outliers, suspicious patterns, and missing data using z-score and IQR methods.' },
    { name: 'RAG Agent', icon: '📚', desc: 'Retrieves relevant sections of the RTI Act, 2005 matched to identified anomalies.' },
    { name: 'Drafting Agent', icon: '📝', desc: 'Generates formal, legally compliant RTI applications combining anomaly data with legal context.' },
];

const STACK = [
    { name: 'React', icon: '⚛️', desc: 'Frontend UI Framework' },
    { name: 'FastAPI', icon: '⚡', desc: 'Backend API Gateway' },
    { name: 'SQLite', icon: '🗄️', desc: 'Primary Database' },
    { name: 'pdfplumber', icon: '📄', desc: 'PDF Processing' },
    { name: 'NumPy / Pandas', icon: '📊', desc: 'Data Analysis' },
    { name: 'Chart.js', icon: '📈', desc: 'Data Visualization' },
];

export default function About() {
    return (
        <div className="about-page container">
            <div className="about-hero animate-in">
                <h1>About JanAudit</h1>
                <p className="about-tagline">
                    An AI-powered civic-tech platform designed to analyze unstructured government
                    financial reports, detect anomalies, and auto-generate legally compliant
                    Right to Information (RTI) application drafts.
                </p>
            </div>

            {/* How It Works */}
            <section className="how-it-works animate-in stagger-1">
                <h2>🔄 How It Works</h2>
                <div className="workflow-steps">
                    <div className="workflow-step">
                        <div className="step-number">1</div>
                        <h3>Upload</h3>
                        <p>Upload a government financial PDF document</p>
                    </div>
                    <div className="workflow-arrow">→</div>
                    <div className="workflow-step">
                        <div className="step-number">2</div>
                        <h3>Extract</h3>
                        <p>AI extracts structured financial data</p>
                    </div>
                    <div className="workflow-arrow">→</div>
                    <div className="workflow-step">
                        <div className="step-number">3</div>
                        <h3>Analyze</h3>
                        <p>Detect anomalies and irregular patterns</p>
                    </div>
                    <div className="workflow-arrow">→</div>
                    <div className="workflow-step">
                        <div className="step-number">4</div>
                        <h3>Act</h3>
                        <p>Generate RTI applications with legal backing</p>
                    </div>
                </div>
            </section>

            {/* AI Agents */}
            <section className="agents-section animate-in stagger-2">
                <h2>🤖 AI Agents</h2>
                <div className="agents-grid">
                    {AGENTS.map(a => (
                        <div key={a.name} className="agent-card card">
                            <div className="agent-icon">{a.icon}</div>
                            <h3>{a.name}</h3>
                            <p>{a.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tech Stack */}
            <section className="stack-section animate-in stagger-3">
                <h2>🛠️ Technology Stack</h2>
                <div className="stack-grid">
                    {STACK.map(s => (
                        <div key={s.name} className="stack-item card">
                            <span className="stack-icon">{s.icon}</span>
                            <div>
                                <strong>{s.name}</strong>
                                <span className="stack-desc">{s.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Legal Disclaimer */}
            <section className="disclaimer animate-in stagger-4">
                <div className="card">
                    <h3>⚖️ Disclaimer</h3>
                    <p>
                        JanAudit is a research and awareness tool. The RTI drafts generated are templates
                        and should be reviewed by the applicant before submission. This tool does not provide
                        legal advice and generated documents should not be treated as legally certified opinions.
                    </p>
                </div>
            </section>
        </div>
    );
}
