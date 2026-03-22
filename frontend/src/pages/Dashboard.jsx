import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import { api } from '../api';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const s = await api.getStats();
            setStats(s);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000)     return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toFixed(0)}`;
    };

    if (loading) {
        return (
            <div className="dash-page container">
                <div className="dash-header">
                    <div className="dash-tricolor" />
                    <h1 className="dash-title">Dashboard</h1>
                </div>
                <div className="metrics-grid">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton metric-skeleton" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="dash-page container">

            {/* Header */}
            <div className="dash-header animate-in">
                <div className="dash-tricolor" />
                <h1 className="dash-title">Dashboard</h1>
                <p className="dash-subtitle">Overview of analyzed government financial data</p>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <div className="animate-in stagger-1">
                    <MetricCard icon="📄" label="Documents Processed"  value={stats?.documentsProcessed ?? 0}          color="blue"   />
                </div>
                <div className="animate-in stagger-2">
                    <MetricCard icon="💰" label="Total Expenditure"     value={formatCurrency(stats?.totalExpenditure)} color="green"  />
                </div>
                <div className="animate-in stagger-3">
                    <MetricCard icon="⚠️" label="Anomalies Detected"   value={stats?.anomaliesDetected ?? 0}           color="orange" />
                </div>
                <div className="animate-in stagger-4">
                    <MetricCard icon="📝" label="RTI Drafts Generated"  value={stats?.rtiDraftsGenerated ?? 0}          color="red"    />
                </div>
            </div>

            {/* Quick action cards */}
            <div className="dash-actions-grid animate-in stagger-2">
                {[
                    { icon: '📊', title: 'Expenditure Analysis', desc: 'View spending breakdowns by category and department.', to: '/expenditure', accent: '#FF9933', accentBg: 'rgba(255,153,51,0.08)', accentBorder: 'rgba(255,153,51,0.20)' },
                    { icon: '⚠️', title: 'Anomaly Feed',         desc: 'Review flagged irregularities and draft RTI requests.',  to: '/anomalies',    accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.08)', accentBorder: 'rgba(245,158,11,0.20)' },
                    { icon: '📤', title: 'Upload Report',        desc: 'Analyze a new government financial PDF document.',       to: '/upload',       accent: '#4CAF50', accentBg: 'rgba(19,136,8,0.08)',   accentBorder: 'rgba(19,136,8,0.20)'   },
                    { icon: '📝', title: 'RTI Workspace',        desc: 'Draft and manage RTI applications under Section 6(1).',  to: '/rti-workspace',accent: '#64B5F6', accentBg: 'rgba(74,144,217,0.08)', accentBorder: 'rgba(74,144,217,0.20)' },
                ].map((card) => (
                    <button
                        key={card.to}
                        className="dash-action-card"
                        onClick={() => navigate(card.to)}
                        style={{ '--card-accent': card.accent, '--card-bg': card.accentBg, '--card-border': card.accentBorder }}
                    >
                        <div className="dac-top-bar" />
                        <div className="dac-icon-wrap">
                            <span className="dac-icon">{card.icon}</span>
                        </div>
                        <div className="dac-body">
                            <span className="dac-title">{card.title}</span>
                            <span className="dac-desc">{card.desc}</span>
                        </div>
                        <span className="dac-arrow">→</span>
                        <div className="dac-hover-line" />
                    </button>
                ))}
            </div>

            {/* Bottom label */}
            <div className="dash-bottom-label animate-in">
                <div className="dash-bottom-line" />
                <span>RTI Act 2005 Compliant · Built for Citizens</span>
                <div className="dash-bottom-line" />
            </div>
        </div>
    );
}