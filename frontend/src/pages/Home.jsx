import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import FileUpload from '../components/FileUpload';
import './Home.css';

const FEATURES = [
    { icon: '🔍', title: 'Automated OCR Extraction', desc: 'Extract structured data from PDF financial documents using advanced parsing' },
    { icon: '📊', title: 'Visual Expenditure Dashboards', desc: 'Interactive charts and analytics to understand government spending patterns' },
    { icon: '🤖', title: 'AI Anomaly Detection', desc: 'Statistical analysis to flag irregular expenditures and suspicious patterns' },
    { icon: '📝', title: 'Instant RTI Drafting', desc: 'Auto-generate legally compliant Right to Information applications' },
];

export default function Home() {
    const navigate = useNavigate();

    const handleUpload = async (file) => {
        const result = await api.uploadDocument(file);
        setTimeout(() => navigate('/dashboard'), 1500);
        return result;
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg" />
                <div className="hero-content container">
                    <div className="hero-badge animate-in">
                        <span>⚖️</span> AI-Powered Civic Tech
                    </div>
                    <h1 className="hero-title animate-in stagger-1">
                        Bridging the gap between<br />
                        <span className="hero-highlight">complex government spending</span><br />
                        and citizen accountability.
                    </h1>
                    <p className="hero-subtitle animate-in stagger-2">
                        Upload government financial reports, detect anomalies in public expenditure,
                        and generate legally compliant RTI applications — all powered by intelligent AI agents.
                    </p>
                    <div className="hero-actions animate-in stagger-3">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
                            Analyze a Report →
                        </button>
                        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
                            View Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Upload */}
            <section className="quick-upload container animate-in stagger-3">
                <h2 className="section-title">Quick Start</h2>
                <FileUpload onUpload={handleUpload} />
            </section>

            {/* Features */}
            <section className="features container">
                <h2 className="section-title animate-in">What JanAudit Does</h2>
                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <div key={f.title} className={`feature-card card animate-in stagger-${i + 1}`}>
                            <div className="feature-icon">{f.icon}</div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Bar */}
            <section className="stats-bar container animate-in">
                <div className="stat-item">
                    <span className="stat-number">4</span>
                    <span className="stat-label">AI Agents</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number">10+</span>
                    <span className="stat-label">RTI Act Sections</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number">30s</span>
                    <span className="stat-label">Avg Processing</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">Open Source</span>
                </div>
            </section>
        </div>
    );
}
