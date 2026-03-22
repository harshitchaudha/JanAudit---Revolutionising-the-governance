import './MetricCard.css';

const COLOR_MAP = {
    blue:   { accent: '#64B5F6', bg: 'rgba(74,144,217,0.10)',  border: 'rgba(74,144,217,0.22)'  },
    green:  { accent: '#4CAF50', bg: 'rgba(19,136,8,0.10)',    border: 'rgba(19,136,8,0.22)'    },
    orange: { accent: '#FF9933', bg: 'rgba(255,153,51,0.10)',  border: 'rgba(255,153,51,0.22)'  },
    red:    { accent: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)'  },
};

export default function MetricCard({ icon, label, value, subtitle, color = 'green' }) {
    const c = COLOR_MAP[color] || COLOR_MAP.green;

    return (
        <div
            className="metric-card"
            style={{
                '--mc-accent': c.accent,
                '--mc-bg':     c.bg,
                '--mc-border': c.border,
            }}
        >
            <div className="mc-icon-wrap">
                <span className="mc-icon">{icon}</span>
            </div>
            <div className="mc-body">
                <span className="mc-value">{value}</span>
                <span className="mc-label">{label}</span>
                {subtitle && <span className="mc-subtitle">{subtitle}</span>}
            </div>
        </div>
    );
}