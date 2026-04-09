import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './AskTheAudit.css';

// ─────────────────────────────────────────────────────────────────────────────
// Intelligent Anomaly Q&A Engine
// Matches user queries against loaded anomaly data using keyword + intent logic
// ─────────────────────────────────────────────────────────────────────────────

function formatINR(amount) {
    if (!amount && amount !== 0) return '—';
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Cr`;
}

function matchAnomalies(query, anomalies) {
    const q = query.toLowerCase().trim();
    const results = [];

    for (const anom of anomalies) {
        let score = 0;
        const desc = (anom.description || '').toLowerCase();
        const type = (anom.anomalyType || '').toLowerCase();
        const dept = (anom.record?.department || '').toLowerCase();
        const proj = (anom.record?.projectName || '').toLowerCase();
        const cat  = (anom.record?.category || '').toLowerCase();

        if (q.includes(type)) score += 10;
        if (dept && q.includes(dept.split(' ')[0])) score += 8;
        const qWords = q.split(/\s+/);
        for (const word of qWords) {
            if (word.length < 3) continue;
            if (proj.includes(word)) score += 5;
            if (desc.includes(word)) score += 2;
            if (cat.includes(word)) score += 3;
            if (dept.includes(word)) score += 4;
        }

        if (score > 0) results.push({ anom, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.anom);
}

function detectIntent(query) {
    const q = query.toLowerCase().trim();

    if (/how many|total|count|number of|overview|summary|all anomal/i.test(q))
        return 'summary';
    if (/high.*confidence|high.*risk|severe|critical|dangerous|worst|most serious/i.test(q))
        return 'high_risk';
    if (/budget.*overrun|overrun|over.*budget|exceeded.*budget/i.test(q))
        return 'budget_overrun';
    if (/duplicate|double|repeated/i.test(q))
        return 'duplicate';
    if (/suspicious|round.*amount|round.*figure/i.test(q))
        return 'suspicious_round';
    if (/outlier|statistical|abnormal|unusual.*spend/i.test(q))
        return 'outlier';
    if (/department|dept|which.*department|health|pwd|smart.*city|public.*works|education/i.test(q))
        return 'department';
    if (/amount|how.*much|money|expenditure|spend|cost|rupee|crore/i.test(q))
        return 'amount';
    if (/help|what.*can.*you|how.*to|guide/i.test(q))
        return 'help';

    return 'general';
}

function generateResponse(query, anomalies, stats) {
    const intent = detectIntent(query);
    const matched = matchAnomalies(query, anomalies);

    switch (intent) {
        case 'help':
            return {
                text: `🏛️ I'm **Ask the Audit** — your AI assistant for exploring detected anomalies in government financial records.\n\nHere are queries you can ask:\n\n` +
                    `• "How many anomalies were found?"\n` +
                    `• "Show me budget overruns"\n` +
                    `• "Which departments have issues?"\n` +
                    `• "What are the high-risk anomalies?"\n` +
                    `• "Tell me about duplicate entries"\n` +
                    `• "Anomalies in health department"\n` +
                    `• "What is the largest amount flagged?"\n` +
                    `• Any keyword related to a specific project or anomaly type!`,
                anomalies: [],
            };

        case 'summary': {
            const types = {};
            anomalies.forEach(a => { types[a.anomalyType] = (types[a.anomalyType] || 0) + 1; });
            const breakdown = Object.entries(types).map(([t, c]) => `• **${t}**: ${c}`).join('\n');
            const totalAmt = anomalies.reduce((s, a) => s + (a.record?.amount || 0), 0);
            return {
                text: `📊 **Anomaly Overview — Audit Summary**\n\n` +
                    `Total anomalies detected: **${anomalies.length}**\n` +
                    `Total flagged amount: **${formatINR(totalAmt)}**\n\n` +
                    `**Breakdown by type:**\n${breakdown}`,
                anomalies: [],
            };
        }

        case 'high_risk': {
            const highRisk = [...anomalies].filter(a => a.confidenceScore >= 0.85)
                .sort((a, b) => b.confidenceScore - a.confidenceScore);
            if (highRisk.length === 0) {
                return { text: `No anomalies with confidence ≥ 85% were found in the current audit records.`, anomalies: [] };
            }
            return {
                text: `🔴 **High-Risk Anomalies** (confidence ≥ 85%)\n\nFound **${highRisk.length}** high-confidence irregularities requiring immediate attention:`,
                anomalies: highRisk.slice(0, 5),
            };
        }

        case 'budget_overrun': {
            const overruns = anomalies.filter(a => a.anomalyType === 'Budget Overrun');
            if (overruns.length === 0) {
                return { text: `No budget overrun anomalies were detected in the current audit dataset.`, anomalies: [] };
            }
            const totalAmt = overruns.reduce((s, a) => s + (a.record?.amount || 0), 0);
            return {
                text: `💸 **Budget Overruns Detected: ${overruns.length}**\n\nTotal flagged amount: **${formatINR(totalAmt)}**\n\nPer CAG norms, overruns above 10% require prior Finance Department approval.`,
                anomalies: overruns,
            };
        }

        case 'duplicate': {
            const dupes = anomalies.filter(a => a.anomalyType === 'Duplicate Entry Discrepancy');
            if (dupes.length === 0) {
                return { text: `No duplicate entry discrepancies were found in the current records.`, anomalies: [] };
            }
            return {
                text: `🔁 **Duplicate Entry Discrepancies: ${dupes.length}**\n\nThese entries appear more than once — possible double-booking of invoices.`,
                anomalies: dupes,
            };
        }

        case 'suspicious_round': {
            const rounds = anomalies.filter(a => a.anomalyType === 'Suspicious Round Amount');
            if (rounds.length === 0) {
                return { text: `No suspicious round-amount anomalies were found.`, anomalies: [] };
            }
            return {
                text: `🔢 **Suspicious Round Amounts: ${rounds.length}**\n\nPerfectly round figures are uncommon in genuine procurement invoices — per CVC guidelines, these warrant scrutiny.`,
                anomalies: rounds,
            };
        }

        case 'outlier': {
            const outliers = anomalies.filter(a =>
                a.anomalyType === 'Statistical Outlier' || a.anomalyType === 'IQR Outlier'
            );
            if (outliers.length === 0) {
                return { text: `No statistical outliers detected in the current dataset.`, anomalies: [] };
            }
            return {
                text: `📈 **Statistical Outliers: ${outliers.length}**\n\nThese expenditures deviate significantly from normal patterns in the audit records.`,
                anomalies: outliers,
            };
        }

        case 'department': {
            const deptMap = {};
            anomalies.forEach(a => {
                const d = a.record?.department || 'Unknown';
                if (!deptMap[d]) deptMap[d] = [];
                deptMap[d].push(a);
            });
            const q = query.toLowerCase();
            for (const [dept, anoms] of Object.entries(deptMap)) {
                const dLower = dept.toLowerCase();
                if (q.includes(dLower.split(' ')[0]) && dLower.split(' ')[0].length > 3) {
                    const totalAmt = anoms.reduce((s, a) => s + (a.record?.amount || 0), 0);
                    return {
                        text: `🏛️ **${dept}**\n\nAnomalies found: **${anoms.length}**\nTotal flagged amount: **${formatINR(totalAmt)}**`,
                        anomalies: anoms.slice(0, 5),
                    };
                }
            }
            const breakdown = Object.entries(deptMap)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([d, a]) => `• **${d}**: ${a.length} anomalies (${formatINR(a.reduce((s, x) => s + (x.record?.amount || 0), 0))})`)
                .join('\n');
            return {
                text: `🏛️ **Anomalies by Department**\n\n${breakdown}`,
                anomalies: [],
            };
        }

        case 'amount': {
            const sorted = [...anomalies].sort((a, b) => (b.record?.amount || 0) - (a.record?.amount || 0));
            const top = sorted.slice(0, 3);
            const totalAmt = anomalies.reduce((s, a) => s + (a.record?.amount || 0), 0);
            return {
                text: `💰 **Flagged Amounts Summary**\n\n` +
                    `Total flagged amount: **${formatINR(totalAmt)}**\n` +
                    `Largest single anomaly: **${formatINR(top[0]?.record?.amount)}**\n\n` +
                    `Top 3 largest anomalies:`,
                anomalies: top,
            };
        }

        default: {
            if (matched.length > 0) {
                const top = matched.slice(0, 4);
                return {
                    text: `Found **${matched.length}** anomal${matched.length === 1 ? 'y' : 'ies'} matching your query:`,
                    anomalies: top,
                };
            }
            return {
                text: `I couldn't find specific anomalies matching "${query}". Try asking about:\n\n` +
                    `• A specific anomaly type (budget overrun, duplicate, outlier)\n` +
                    `• A department (health, PWD, smart city)\n` +
                    `• A project name or keyword\n` +
                    `• Type **help** for all available queries`,
                anomalies: [],
            };
        }
    }
}

// ─── Simple markdown-ish renderer (bold + newlines) ─────────
function renderMarkdown(text) {
    return text.split('\n').map((line, i) => {
        const parts = [];
        let remaining = line;
        let key = 0;
        while (remaining.includes('**')) {
            const start = remaining.indexOf('**');
            const end = remaining.indexOf('**', start + 2);
            if (end === -1) break;
            if (start > 0) parts.push(<span key={key++}>{remaining.slice(0, start)}</span>);
            parts.push(<strong key={key++}>{remaining.slice(start + 2, end)}</strong>);
            remaining = remaining.slice(end + 2);
        }
        if (remaining) parts.push(<span key={key++}>{remaining}</span>);
        return (
            <span key={i} style={{ display: 'block', minHeight: line.trim() ? 'auto' : '0.4em' }}>
                {parts.length > 0 ? parts : line}
            </span>
        );
    });
}

// ─── Confidence class helper ────────────────────────────────
function confidenceClass(score) {
    if (score >= 0.8) return 'ata-anom-confidence-high';
    if (score >= 0.6) return 'ata-anom-confidence-med';
    return 'ata-anom-confidence-low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const GREETING = {
    text: `🏛️ Namaste! I'm **Ask the Audit** — your AI-powered companion for analysing detected anomalies in government financial records.\n\nYou may ask about flagged irregularities, departments, amounts, or anomaly types. Type **help** for a full list of queries.`,
    anomalies: [],
    isBot: true,
};

export default function AskTheAudit() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([GREETING]);
    const [input, setInput] = useState('');
    const [anomalies, setAnomalies] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && !dataLoaded) {
            loadData();
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [anom, s] = await Promise.all([
                api.getAnomalies(),
                api.getStats(),
            ]);
            setAnomalies(anom || []);
            setStats(s);
            setDataLoaded(true);
        } catch (err) {
            console.error('AskTheAudit: Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const userMsg = { text: trimmed, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        setLoading(true);
        setTimeout(() => {
            const response = generateResponse(trimmed, anomalies, stats);
            const botMsg = { ...response, isBot: true };
            setMessages(prev => [...prev, botMsg]);
            setLoading(false);
        }, 400 + Math.random() * 400);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickQuery = (query) => {
        setInput('');
        const userMsg = { text: query, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        setTimeout(() => {
            const response = generateResponse(query, anomalies, stats);
            const botMsg = { ...response, isBot: true };
            setMessages(prev => [...prev, botMsg]);
            setLoading(false);
        }, 500 + Math.random() * 400);
    };

    return (
        <div className="ata-container">
            {isOpen && (
                <div className="ata-panel">
                    {/* Header */}
                    <div className="ata-header">
                        <div className="ata-header-left">
                            <div className="ata-avatar">
                                <span className="ata-avatar-icon">⚖️</span>
                                <span className="ata-avatar-pulse" />
                            </div>
                            <div>
                                <h3 className="ata-title">Ask the Audit</h3>
                                <span className="ata-subtitle">
                                    {dataLoaded
                                        ? `${anomalies.length} anomalies loaded`
                                        : 'Connecting to audit data…'
                                    }
                                </span>
                            </div>
                        </div>
                        <button className="ata-close-btn" onClick={() => setIsOpen(false)} title="Close">
                            ✕
                        </button>
                    </div>

                    {/* Government disclaimer banner */}
                    <div className="ata-govt-notice">
                        <span className="ata-govt-notice-icon">🛡️</span>
                        RTI Act 2005 Compliant — AI-Assisted Audit Analysis
                    </div>

                    {/* Quick Queries */}
                    {messages.length <= 1 && (
                        <div className="ata-quick-queries">
                            {[
                                { label: '📊 Overview', query: 'Overview' },
                                { label: '🔴 High Risk', query: 'High-risk anomalies' },
                                { label: '💸 Budget Overruns', query: 'Budget overruns' },
                                { label: '🏛️ By Department', query: 'By department' },
                                { label: '🔁 Duplicates', query: 'Duplicate entries' },
                                { label: '💰 Top Amounts', query: 'Largest amounts' },
                            ].map((q) => (
                                <button
                                    key={q.query}
                                    className="ata-quick-btn"
                                    onClick={() => handleQuickQuery(q.query)}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages */}
                    <div className="ata-messages">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`ata-msg ${msg.isBot ? 'ata-msg-bot' : 'ata-msg-user'}`}
                            >
                                {msg.isBot && <span className="ata-msg-avatar">⚖️</span>}
                                <div className="ata-msg-content">
                                    <div className="ata-msg-text">{renderMarkdown(msg.text)}</div>
                                    {msg.anomalies && msg.anomalies.length > 0 && (
                                        <div className="ata-anom-cards">
                                            {msg.anomalies.map((a) => (
                                                <div key={a.id} className="ata-anom-mini">
                                                    <div className="ata-anom-mini-header">
                                                        <span className="ata-anom-type-badge">
                                                            {a.anomalyType}
                                                        </span>
                                                        <span className={`ata-anom-confidence ${confidenceClass(a.confidenceScore)}`}>
                                                            {Math.round(a.confidenceScore * 100)}%
                                                        </span>
                                                    </div>
                                                    <p className="ata-anom-project">
                                                        {a.record?.projectName || 'Unknown Project'}
                                                    </p>
                                                    <div className="ata-anom-meta">
                                                        <span>{a.record?.department}</span>
                                                        <span className="ata-anom-amount">
                                                            {formatINR(a.record?.amount)}
                                                        </span>
                                                    </div>
                                                    <p className="ata-anom-desc">
                                                        {a.description?.slice(0, 120)}…
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="ata-msg ata-msg-bot">
                                <span className="ata-msg-avatar">⚖️</span>
                                <div className="ata-msg-content">
                                    <div className="ata-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="ata-input-bar">
                        <input
                            ref={inputRef}
                            type="text"
                            className="ata-input"
                            placeholder="Ask about anomalies, departments, amounts…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            id="ask-the-audit-input"
                        />
                        <button
                            className="ata-send-btn"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            title="Send"
                            id="ask-the-audit-send"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="ata-footer">
                        POWERED BY JANAUDIT AI · SATYAMEVA JAYATE
                    </div>
                </div>
            )}

            <button
                className={`ata-fab ${isOpen ? 'ata-fab-active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Ask the Audit"
                id="ask-the-audit-fab"
            >
                {isOpen ? '✕' : (
                    <>
                        <span className="ata-fab-emblem">⚖️</span>
                        <span className="ata-fab-label">Ask the Audit</span>
                    </>
                )}
            </button>
        </div>
    );
}
