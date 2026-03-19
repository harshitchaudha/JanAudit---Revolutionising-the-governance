import { useState } from 'react';
import './AnomalyCard.css';

const TYPE_CONFIG = {
    'Statistical Outlier': {
        icon: '📊',
        color: 'orange',
        what: 'Spending amount is statistically abnormal compared to all other items in the same report.',
    },
    'IQR Outlier': {
        icon: '📈',
        color: 'orange',
        what: 'Spending falls far outside the normal range for this document.',
    },
    'Duplicate Entry Discrepancy': {
        icon: '🔁',
        color: 'red',
        what: 'This entry appears more than once with the same or very similar details — possible double-booking.',
    },
    'Budget Overrun': {
        icon: '💸',
        color: 'red',
        what: 'Actual expenditure exceeded the sanctioned budget provision.',
    },
    'Suspicious Round Amount': {
        icon: '🔢',
        color: 'yellow',
        what: 'Amount is a perfectly round figure — unusual in real procurement invoices.',
    },
    'Invalid Amount': {
        icon: '❌',
        color: 'red',
        what: 'Amount is zero or negative — likely a data entry error.',
    },
};

function formatINR(amount) {
    if (!amount && amount !== 0) return '—';
    return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function ConfidenceMeter({ score }) {
    const pct = Math.round(score * 100);
    const color = score >= 0.75 ? '#ef4444' : score >= 0.5 ? '#f97316' : '#eab308';
    return (
        <div className="confidence-meter">
            <div className="meter-bar">
                <div className="meter-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="meter-label" style={{ color }}>{pct}% confidence</span>
        </div>
    );
}

export default function AnomalyCard({ anomaly, onReview, onGenerateRTI }) {
    const [expanded, setExpanded] = useState(false);

    const record = anomaly.record;
    const config = TYPE_CONFIG[anomaly.anomalyType] || { icon: '⚠️', color: 'orange', what: '' };
    const confidenceClass = anomaly.confidenceScore >= 0.7 ? 'high' : anomaly.confidenceScore >= 0.4 ? 'medium' : 'low';

    // Parse structured info out of the description
    const descLines = anomaly.description?.split('\n').filter(Boolean) || [];

    return (
        <div className={`anomaly-card card confidence-border-${config.color}`}>

            {/* ── TOP HEADER ── */}
            <div className="ac-header">
                <div className="ac-type-badge" data-color={config.color}>
                    <span>{config.icon}</span>
                    <span className="ac-type-label">{anomaly.anomalyType}</span>
                </div>
                <ConfidenceMeter score={anomaly.confidenceScore} />
            </div>

            {/* ── WHAT THIS MEANS (plain english) ── */}
            {config.what && (
                <div className="ac-what-box">
                    <span className="ac-what-label">What this means:</span>
                    <span className="ac-what-text">{config.what}</span>
                </div>
            )}

            {/* ── ITEM LOCATION (WHERE exactly) ── */}
            {record && (
                <div className="ac-location-grid">
                    <div className="ac-loc-item">
                        <span className="ac-loc-icon">📋</span>
                        <div>
                            <div className="ac-loc-key">Item / Project</div>
                            <div className="ac-loc-val">{record.projectName || '—'}</div>
                        </div>
                    </div>
                    <div className="ac-loc-item">
                        <span className="ac-loc-icon">🏷️</span>
                        <div>
                            <div className="ac-loc-key">Category</div>
                            <div className="ac-loc-val">{record.category || 'General'}</div>
                        </div>
                    </div>
                    <div className="ac-loc-item">
                        <span className="ac-loc-icon">💰</span>
                        <div>
                            <div className="ac-loc-key">Amount Flagged</div>
                            <div className="ac-loc-val amount-highlight">{formatINR(record.amount)}</div>
                        </div>
                    </div>
                    {record.transactionDate && (
                        <div className="ac-loc-item">
                            <span className="ac-loc-icon">📅</span>
                            <div>
                                <div className="ac-loc-key">Date</div>
                                <div className="ac-loc-val">
                                    {new Date(record.transactionDate).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── DESCRIPTION (expandable) ── */}
            <div className="ac-description-section">
                <button className="ac-expand-btn" onClick={() => setExpanded(e => !e)}>
                    {expanded ? '▲ Hide Details' : '▼ Why is this flagged?'}
                </button>
                {expanded && (
                    <div className="ac-description-box">
                        <p className="ac-description-text">{anomaly.description}</p>
                    </div>
                )}
            </div>

            {/* ── ACTIONS ── */}
            <div className="ac-actions">
                {onReview && (
                    <button className="btn btn-secondary btn-sm" onClick={() => onReview(anomaly)}>
                        🔍 Review Details
                    </button>
                )}
                {onGenerateRTI && (
                    <button className="btn btn-primary btn-sm" onClick={() => onGenerateRTI(anomaly)}>
                        📝 Generate RTI
                    </button>
                )}
            </div>
        </div>
    );
}