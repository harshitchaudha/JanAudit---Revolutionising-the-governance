import { useState, useEffect, useRef } from 'react';
import './Visualizations.css';

// ─── DUMMY DATA ────────────────────────────────────────────────────────────────
const DEPARTMENT_DATA = [
    { dept: 'Public Works', allocated: 8450, spent: 9820, unit: 'Lakhs' },
    { dept: 'Healthcare',   allocated: 6200, spent: 5810, unit: 'Lakhs' },
    { dept: 'Education',    allocated: 5900, spent: 6340, unit: 'Lakhs' },
    { dept: 'Water Supply', allocated: 4100, spent: 4100, unit: 'Lakhs' },
    { dept: 'Transport',    allocated: 7300, spent: 8950, unit: 'Lakhs' },
    { dept: 'Sanitation',   allocated: 2800, spent: 2410, unit: 'Lakhs' },
    { dept: 'Housing',      allocated: 5100, spent: 5540, unit: 'Lakhs' },
    { dept: 'Agriculture',  allocated: 3600, spent: 3190, unit: 'Lakhs' },
];

const CATEGORY_PIE = [
    { label: 'Civil Construction',  value: 31.4, color: '#FF9933' },
    { label: 'Salaries & Benefits', value: 22.8, color: '#4CAF50' },
    { label: 'Procurement',         value: 17.2, color: '#64B5F6' },
    { label: 'Maintenance',         value: 11.5, color: '#f59e0b' },
    { label: 'Consultancy',         value: 8.9,  color: '#a78bfa' },
    { label: 'Miscellaneous',       value: 8.2,  color: '#f87171' },
];

const QUARTERLY_TREND = [
    { quarter: 'Q1 FY23', allocated: 10200, spent: 9800 },
    { quarter: 'Q2 FY23', allocated: 11400, spent: 12100 },
    { quarter: 'Q3 FY23', allocated: 13800, spent: 14900 },
    { quarter: 'Q4 FY23', allocated: 15600, spent: 16800 },
    { quarter: 'Q1 FY24', allocated: 12300, spent: 11900 },
    { quarter: 'Q2 FY24', allocated: 14100, spent: 15600 },
];

const ANOMALY_BREAKDOWN = [
    { type: 'Budget Overrun',              count: 14, color: '#ef4444' },
    { type: 'Statistical Outlier',         count: 21, color: '#f97316' },
    { type: 'Suspicious Round Amount',     count: 18, color: '#eab308' },
    { type: 'Duplicate Entry',             count: 9,  color: '#a78bfa' },
    { type: 'IQR Outlier',                 count: 11, color: '#64B5F6' },
    { type: 'Invalid Amount',              count: 5,  color: '#f87171' },
];

const TOP_OVERRUNS = [
    { project: 'NH-72 Road Widening Phase II', dept: 'Transport',     overrun: 1650, pct: 22.6 },
    { project: 'District Hospital Renovation',  dept: 'Healthcare',    overrun: 1120, pct: 18.1 },
    { project: 'Smart City CCTV Network',       dept: 'Public Works',  overrun:  980, pct: 11.6 },
    { project: 'Primary School Construction',   dept: 'Education',     overrun:  440, pct: 7.5  },
    { project: 'Sewage Treatment Plant',        dept: 'Sanitation',    overrun:  390, pct: 13.9 },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = (v) => v >= 10000 ? `₹${(v/100).toFixed(1)}Cr` : `₹${v}L`;

// ─── ANIMATED NUMBER ───────────────────────────────────────────────────────────
function AnimNum({ target, prefix = '', suffix = '', decimals = 0 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let start = null;
        const dur = 1200;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(target * ease);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target]);
    return <>{prefix}{decimals ? val.toFixed(decimals) : Math.round(val)}{suffix}</>;
}

// ─── BAR CHART ─────────────────────────────────────────────────────────────────
function DeptBarChart() {
    const [hovered, setHovered] = useState(null);
    const maxVal = Math.max(...DEPARTMENT_DATA.flatMap(d => [d.allocated, d.spent]));

    return (
        <div className="viz-card">
            <div className="viz-card-header">
                <div className="viz-card-title-group">
                    <span className="viz-card-icon">🏛️</span>
                    <div>
                        <h3>Department Budget vs Expenditure</h3>
                        <p>FY 2023–24 · Figures in Lakhs (₹)</p>
                    </div>
                </div>
                <div className="viz-legend">
                    <span className="leg-dot" style={{background:'#4CAF50'}} />Allocated
                    <span className="leg-dot" style={{background:'#FF9933', marginLeft:12}} />Spent
                </div>
            </div>
            <div className="bar-chart-wrap">
                {DEPARTMENT_DATA.map((d, i) => {
                    const allocPct = (d.allocated / maxVal) * 100;
                    const spentPct = (d.spent / maxVal) * 100;
                    const over = d.spent > d.allocated;
                    return (
                        <div
                            key={d.dept}
                            className={`bar-row ${hovered === i ? 'hovered' : ''}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className="bar-label">{d.dept}</div>
                            <div className="bar-tracks">
                                <div className="bar-track">
                                    <div
                                        className="bar-fill alloc"
                                        style={{ '--w': `${allocPct}%`, animationDelay: `${i * 0.08}s` }}
                                    />
                                    <span className="bar-val">{fmt(d.allocated)}</span>
                                </div>
                                <div className="bar-track">
                                    <div
                                        className={`bar-fill spent ${over ? 'over' : ''}`}
                                        style={{ '--w': `${spentPct}%`, animationDelay: `${i * 0.08 + 0.05}s` }}
                                    />
                                    <span className={`bar-val ${over ? 'text-red' : ''}`}>
                                        {fmt(d.spent)} {over && <span className="overrun-tag">▲ Overrun</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── PIE CHART (SVG) ───────────────────────────────────────────────────────────
function PieChart({ data, title, subtitle, icon }) {
    const [hovered, setHovered] = useState(null);
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

    const total = data.reduce((s, d) => s + d.value, 0);
    let cumulative = 0;
    const slices = data.map((d, i) => {
        const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
        cumulative += d.value;
        const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
        const r = 80, cx = 110, cy = 110;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const midAngle = (startAngle + endAngle) / 2;
        const isHov = hovered === i;
        const offset = isHov ? 8 : 0;
        const ox = cx + offset * Math.cos(midAngle);
        const oy = cy + offset * Math.sin(midAngle);
        return { ...d, i, x1, y1, x2, y2, largeArc, cx: ox, cy: oy, midAngle };
    });

    return (
        <div className="viz-card">
            <div className="viz-card-header">
                <div className="viz-card-title-group">
                    <span className="viz-card-icon">{icon}</span>
                    <div>
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                </div>
            </div>
            <div className="pie-wrap">
                <svg
                    viewBox="0 0 220 220"
                    className={`pie-svg ${animated ? 'pie-animated' : ''}`}
                >
                    {slices.map((s) => (
                        <path
                            key={s.i}
                            d={`M ${s.cx} ${s.cy} L ${s.cx + 80 * Math.cos((s.midAngle))} ${s.cy + 80 * Math.sin(s.midAngle)} A 80 80 0 ${s.largeArc} 1 ${s.cx + (s.x2 - 110) + 110 - (s.cx - 110)} ${s.cy + (s.y2 - 110) + 110 - (s.cy - 110)} Z`}
                            fill={s.color}
                            opacity={hovered === null || hovered === s.i ? 1 : 0.55}
                            className="pie-slice"
                            onMouseEnter={() => setHovered(s.i)}
                            onMouseLeave={() => setHovered(null)}
                            d={`M ${s.cx} ${s.cy} L ${s.cx + (s.x1 - 110)} ${s.cy + (s.y1 - 110)} A 80 80 0 ${s.largeArc} 1 ${s.cx + (s.x2 - 110)} ${s.cy + (s.y2 - 110)} Z`}
                        />
                    ))}
                    <circle cx="110" cy="110" r="44" fill="var(--viz-card-bg)" />
                    {hovered !== null ? (
                        <>
                            <text x="110" y="106" textAnchor="middle" className="pie-center-pct">{data[hovered].value}%</text>
                            <text x="110" y="122" textAnchor="middle" className="pie-center-label">{data[hovered].label.split(' ')[0]}</text>
                        </>
                    ) : (
                        <text x="110" y="114" textAnchor="middle" className="pie-center-total">Total</text>
                    )}
                </svg>
                <div className="pie-legend">
                    {data.map((d, i) => (
                        <div
                            key={i}
                            className={`pie-leg-row ${hovered === i ? 'pie-leg-active' : ''}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span className="pie-leg-dot" style={{ background: d.color }} />
                            <span className="pie-leg-label">{d.label}</span>
                            <span className="pie-leg-val">{d.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── TREND LINE CHART ──────────────────────────────────────────────────────────
function TrendChart() {
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);
    const W = 540, H = 180, PAD = { t: 20, r: 20, b: 40, l: 60 };
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;
    const allVals = QUARTERLY_TREND.flatMap(d => [d.allocated, d.spent]);
    const minV = Math.min(...allVals) * 0.9;
    const maxV = Math.max(...allVals) * 1.05;
    const xStep = chartW / (QUARTERLY_TREND.length - 1);
    const yScale = (v) => chartH - ((v - minV) / (maxV - minV)) * chartH;

    const linePoints = (key) =>
        QUARTERLY_TREND.map((d, i) => `${PAD.l + i * xStep},${PAD.t + yScale(d[key])}`).join(' ');

    const areaPath = (key) => {
        const pts = QUARTERLY_TREND.map((d, i) => [PAD.l + i * xStep, PAD.t + yScale(d[key])]);
        return `M ${pts[0][0]} ${pts[0][1]} ` +
            pts.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ') +
            ` L ${pts[pts.length-1][0]} ${PAD.t + chartH} L ${pts[0][0]} ${PAD.t + chartH} Z`;
    };

    return (
        <div className="viz-card viz-card-wide">
            <div className="viz-card-header">
                <div className="viz-card-title-group">
                    <span className="viz-card-icon">📈</span>
                    <div>
                        <h3>Quarterly Spending Trend</h3>
                        <p>Allocated vs Actual Expenditure · FY 2023–24</p>
                    </div>
                </div>
                <div className="viz-legend">
                    <span className="leg-dot" style={{background:'#4CAF50'}} />Allocated
                    <span className="leg-dot" style={{background:'#FF9933', marginLeft:12}} />Spent
                </div>
            </div>
            <div className="trend-scroll">
                <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg">
                    <defs>
                        <linearGradient id="gradAlloc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF9933" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#FF9933" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const y = PAD.t + t * chartH;
                        const val = Math.round(maxV - t * (maxV - minV));
                        return (
                            <g key={t}>
                                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--viz-grid)" strokeDasharray="4 4" />
                                <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="axis-label">₹{(val/100).toFixed(0)}Cr</text>
                            </g>
                        );
                    })}
                    {/* X labels */}
                    {QUARTERLY_TREND.map((d, i) => (
                        <text key={i} x={PAD.l + i * xStep} y={H - 8} textAnchor="middle" className="axis-label">{d.quarter}</text>
                    ))}
                    {/* Area fills */}
                    <path d={areaPath('allocated')} fill="url(#gradAlloc)" className={animated ? 'area-animated' : ''} />
                    <path d={areaPath('spent')} fill="url(#gradSpent)" className={animated ? 'area-animated' : ''} />
                    {/* Lines */}
                    <polyline points={linePoints('allocated')} fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinejoin="round" className={`trend-line ${animated ? 'line-draw' : ''}`} />
                    <polyline points={linePoints('spent')} fill="none" stroke="#FF9933" strokeWidth="2.5" strokeLinejoin="round" className={`trend-line ${animated ? 'line-draw' : ''}`} />
                    {/* Dots */}
                    {QUARTERLY_TREND.map((d, i) => (
                        <g key={i}>
                            <circle cx={PAD.l + i * xStep} cy={PAD.t + yScale(d.allocated)} r="4" fill="#4CAF50" className="trend-dot" />
                            <circle cx={PAD.l + i * xStep} cy={PAD.t + yScale(d.spent)} r="4" fill="#FF9933" className="trend-dot" />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}

// ─── ANOMALY TYPE BAR ──────────────────────────────────────────────────────────
function AnomalyBreakdown() {
    const max = Math.max(...ANOMALY_BREAKDOWN.map(d => d.count));
    return (
        <div className="viz-card">
            <div className="viz-card-header">
                <div className="viz-card-title-group">
                    <span className="viz-card-icon">⚠️</span>
                    <div>
                        <h3>Anomaly Type Breakdown</h3>
                        <p>78 total anomalies detected across 12 documents</p>
                    </div>
                </div>
            </div>
            <div className="anomaly-breakdown-list">
                {ANOMALY_BREAKDOWN.map((d, i) => (
                    <div key={i} className="ab-row" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="ab-label">{d.type}</div>
                        <div className="ab-bar-wrap">
                            <div className="ab-bar" style={{ '--w': `${(d.count / max) * 100}%`, '--color': d.color }} />
                        </div>
                        <div className="ab-count" style={{ color: d.color }}>{d.count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── TOP OVERRUNS TABLE ────────────────────────────────────────────────────────
function TopOverrunsTable() {
    return (
        <div className="viz-card viz-card-wide">
            <div className="viz-card-header">
                <div className="viz-card-title-group">
                    <span className="viz-card-icon">🚨</span>
                    <div>
                        <h3>Top Budget Overruns</h3>
                        <p>Projects with highest excess expenditure in FY 2023–24</p>
                    </div>
                </div>
            </div>
            <div className="overrun-table-wrap">
                <table className="overrun-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Project</th>
                            <th>Department</th>
                            <th>Overrun Amount</th>
                            <th>Excess %</th>
                            <th>Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TOP_OVERRUNS.map((r, i) => {
                            const severity = r.pct >= 20 ? { label: 'Critical', cls: 'sev-critical' } :
                                             r.pct >= 12 ? { label: 'High',     cls: 'sev-high'     } :
                                                           { label: 'Medium',   cls: 'sev-medium'   };
                            return (
                                <tr key={i} className="overrun-row" style={{ animationDelay: `${i * 0.07}s` }}>
                                    <td className="row-num">{i + 1}</td>
                                    <td className="project-name">{r.project}</td>
                                    <td><span className="dept-tag">{r.dept}</span></td>
                                    <td className="amount-cell">₹{r.overrun}L</td>
                                    <td className="pct-cell">
                                        <span className="pct-pill" style={{ '--pct-color': severity.cls === 'sev-critical' ? '#ef4444' : severity.cls === 'sev-high' ? '#f97316' : '#eab308' }}>
                                            +{r.pct}%
                                        </span>
                                    </td>
                                    <td><span className={`sev-badge ${severity.cls}`}>{severity.label}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── SUMMARY STATS ─────────────────────────────────────────────────────────────
function SummaryStats() {
    const stats = [
        { icon: '💰', label: 'Total Allocated', value: 43450, prefix: '₹', suffix: 'L', color: '#4CAF50' },
        { icon: '📤', label: 'Total Spent',      value: 46160, prefix: '₹', suffix: 'L', color: '#FF9933' },
        { icon: '📉', label: 'Budget Overrun',   value: 2710,  prefix: '₹', suffix: 'L', color: '#ef4444' },
        { icon: '⚠️', label: 'Anomalies Found', value: 78,    prefix: '',  suffix: '',   color: '#f59e0b' },
    ];
    return (
        <div className="summary-stats-row">
            {stats.map((s, i) => (
                <div key={i} className="summary-stat-card" style={{ '--accent': s.color, animationDelay: `${i * 0.1}s` }}>
                    <div className="ss-icon">{s.icon}</div>
                    <div className="ss-value" style={{ color: s.color }}>
                        <AnimNum target={s.value} prefix={s.prefix} suffix={s.suffix} />
                    </div>
                    <div className="ss-label">{s.label}</div>
                    <div className="ss-accent-bar" />
                </div>
            ))}
        </div>
    );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Visualizations() {
    return (
        <div className="viz-page container">
            <div className="viz-page-header animate-in">
                <div className="viz-header-left">
                    <div className="viz-tricolor" />
                    <div>
                        <h1 className="viz-title">📊 Financial Visualizations</h1>
                        <p className="viz-subtitle">
                            Interactive analysis of government audit data · FY 2023–24
                        </p>
                    </div>
                </div>
                <div className="viz-report-badge">
                    <span className="vrb-dot" />
                    <span>Uttarakhand State Audit Report</span>
                </div>
            </div>

            <SummaryStats />

            <div className="viz-grid">
                <div className="viz-col-full animate-in stagger-1">
                    <DeptBarChart />
                </div>
                <div className="viz-col-full animate-in stagger-2">
                    <TrendChart />
                </div>
                <div className="viz-col-half animate-in stagger-3">
                    <PieChart
                        data={CATEGORY_PIE}
                        title="Spending by Category"
                        subtitle="Share of total expenditure per type"
                        icon="🥧"
                    />
                </div>
                <div className="viz-col-half animate-in stagger-3">
                    <AnomalyBreakdown />
                </div>
                <div className="viz-col-full animate-in stagger-4">
                    <TopOverrunsTable />
                </div>
            </div>

            <div className="viz-footer animate-in">
                <div className="viz-footer-line" />
                <span>Data sourced from uploaded audit PDF · RTI Act 2005 Compliant</span>
                <div className="viz-footer-line" />
            </div>
        </div>
    );
}