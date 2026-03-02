import './MetricCard.css';

export default function MetricCard({ icon, label, value, subtitle, color = 'green' }) {
    return (
        <div className={`metric-card card metric-${color}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <span className="metric-value">{value}</span>
                <span className="metric-label">{label}</span>
                {subtitle && <span className="metric-subtitle">{subtitle}</span>}
            </div>
            <div className={`metric-glow glow-${color}`} />
        </div>
    );
}
