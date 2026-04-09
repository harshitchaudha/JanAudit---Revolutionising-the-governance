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

        // Exact type match
        if (q.includes(type)) score += 10;
        // Department match
        if (dept && q.includes(dept.split(' ')[0])) score += 8;
        // Project name partial match
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

    // Summary / overview intents
    if (/how many|total|count|number of|overview|summary|all anomal/i.test(q))
        return 'summary';

    // Severity / risk
    if (/high.*confidence|high.*risk|severe|critical|dangerous|worst|most serious/i.test(q))
        return 'high_risk';

    // Budget overrun
    if (/budget.*overrun|overrun|over.*budget|exceeded.*budget/i.test(q))
        return 'budget_overrun';

    // Duplicate
    if (/duplicate|double|repeated/i.test(q))
        return 'duplicate';

    // Suspicious / round
    if (/suspicious|round.*amount|round.*figure/i.test(q))
        return 'suspicious_round';

    // Statistical outlier
    if (/outlier|statistical|abnormal|unusual.*spend/i.test(q))
        return 'outlier';

    // Department
    if (/department|dept|which.*department|health|pwd|smart.*city|public.*works|education/i.test(q))
        return 'department';

    // Amount / money
    if (/amount|how.*much|money|expenditure|spend|cost|rupee|crore/i.test(q))
        return 'amount';

    // Help
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
                text: `I'm **Ask the Audit** — your AI assistant for exploring detected anomalies. Here's what you can ask me:\n\n` +
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
                text: `📊 **Anomaly Overview**\n\n` +
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
                return { text: `No anomalies with confidence ≥ 85% were found.`, anomalies: [] };
            }
            return {
                text: `🔴 **High-Risk Anomalies** (confidence ≥ 85%)\n\nFound **${highRisk.length}** high-confidence anomalies:`,
                anomalies: highRisk.slice(0, 5),
            };
        }

        case 'budget_overrun': {
            const overruns = anomalies.filter(a => a.anomalyType === 'Budget Overrun');
            if (overruns.length === 0) {
                return { text: `No budget overrun anomalies were detected in the current dataset.`, anomalies: [] };
            }
            const totalAmt = overruns.reduce((s, a) => s + (a.record?.amount || 0), 0);
            return {
                text: `💸 **Budget Overruns Detected: ${overruns.length}**\n\nTotal flagged amount: **${formatINR(totalAmt)}**`,
                anomalies: overruns,
            };
        }

        case 'duplicate': {
            const dupes = anomalies.filter(a => a.anomalyType === 'Duplicate Entry Discrepancy');
            if (dupes.length === 0) {
                return { text: `No duplicate entry discrepancies were found.`, anomalies: [] };
            }
            return {
                text: `🔁 **Duplicate Entry Discrepancies: ${dupes.length}**\n\nThese entries appear more than once with identical or very similar details.`,
                anomalies: dupes,
            };
        }

        case 'suspicious_round': {
            const rounds = anomalies.filter(a => a.anomalyType === 'Suspicious Round Amount');
            if (rounds.length === 0) {
                return { text: `No suspicious round-amount anomalies were found.`, anomalies: [] };
            }
            return {
                text: `🔢 **Suspicious Round Amounts: ${rounds.length}**\n\nPerfectly round figures are unusual in real procurement — these warrant attention.`,
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
                text: `📈 **Statistical Outliers: ${outliers.length}**\n\nThese expenditures deviate significantly from normal patterns.`,
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
            // Check if query mentions a specific department
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
            // General department breakdown
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
            // General query — try keyword matching
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
                    `• "help" for all available queries`,
                anomalies: [],
            };
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple markdown-ish renderer (bold + newlines)
// ─────────────────────────────────────────────────────────────────────────────
function renderMarkdown(text) {
    return text.split('\n').map((line, i) => {
        // Replace **bold** with <strong>
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
            <span key={i} style={{ display: 'block', minHeight: line.trim() ? 'auto' : '0.5em' }}>
                {parts.length > 0 ? parts : line}
            </span>
        );
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const GREETING = {
    text: `👋 Hi! I'm **Ask the Audit** — your AI companion for understanding detected anomalies.\n\nAsk me anything about the flagged irregularities, departments, amounts, or anomaly types. Type **help** for a full list of queries.`,
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

    // Load anomaly data on first open
    useEffect(() => {
        if (isOpen && !dataLoaded) {
            loadData();
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Scroll to bottom on new messages
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

        // Add user message
        const userMsg = { text: trimmed, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate thinking delay
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
        setInput(query);
        setTimeout(() => {
            const userMsg = { text: query, isBot: false };
            setMessages(prev => [...prev, userMsg]);
            setLoading(true);
            setTimeout(() => {
                const response = generateResponse(query, anomalies, stats);
                const botMsg = { ...response, isBot: true };
                setMessages(prev => [...prev, botMsg]);
                setLoading(false);
            }, 400 + Math.random() * 400);
            setInput('');
        }, 50);
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
                                        : 'Loading data…'
                                    }
                                </span>
                            </div>
                        </div>
                        <button className="ata-close-btn" onClick={() => setIsOpen(false)} title="Close">
                            ✕
                        </button>
                    </div>

                    {/* Quick Queries */}
                    {messages.length <= 1 && (
                        <div className="ata-quick-queries">
                            {[
                                '📊 Overview',
                                '🔴 High-risk anomalies',
                                '💸 Budget overruns',
                                '🏛️ By department',
                            ].map((q) => (
                                <button
                                    key={q}
                                    className="ata-quick-btn"
                                    onClick={() => handleQuickQuery(q.replace(/^..\s/, ''))}
                                >
                                    {q}
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
                                                        <span className="ata-anom-confidence">
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
                                                        {a.description?.slice(0, 140)}…
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <button
                className={`ata-fab ${isOpen ? 'ata-fab-active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Ask the Audit"
                id="ask-the-audit-fab"
            >
                {isOpen ? '✕' : '⚖️'}
                {!isOpen && <span className="ata-fab-label">Ask the Audit</span>}
            </button>
        </div>
    );
}
