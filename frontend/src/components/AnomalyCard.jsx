import './AnomalyCard.css';

export default function AnomalyCard({ anomaly, onReview, onGenerateRTI }) {
    const confidenceClass =
        anomaly.confidenceScore >= 0.7 ? 'high' :
            anomaly.confidenceScore >= 0.4 ? 'medium' : 'low';

    return (
        <div className={`anomaly-card card confidence-${confidenceClass}`}>
            <div className="anomaly-header">
                <div className="anomaly-badge">
                    <span className="anomaly-warning">⚠️</span>
                    <span className="anomaly-type">{anomaly.anomalyType}</span>
                </div>
                <div className={`confidence-pill ${confidenceClass}`}>
                    {(anomaly.confidenceScore * 100).toFixed(0)}%
                </div>
            </div>

            <p className="anomaly-description">{anomaly.description}</p>

            {anomaly.record && (
                <div className="anomaly-record-info">
                    <span className="record-tag">📋 {anomaly.record.projectName}</span>
                    <span className="record-amount">₹{anomaly.record.amount?.toLocaleString('en-IN')}</span>
                </div>
            )}

            <div className="anomaly-actions">
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
