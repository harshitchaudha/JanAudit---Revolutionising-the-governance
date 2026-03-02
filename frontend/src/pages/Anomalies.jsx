import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnomalyCard from '../components/AnomalyCard';
import { api } from '../api';
import './Anomalies.css';

export default function Anomalies() {
    const navigate = useNavigate();
    const [anomalies, setAnomalies] = useState([]);
    const [types, setTypes] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [anom, t] = await Promise.all([
                api.getAnomalies(),
                api.getAnomalyTypes(),
            ]);
            setAnomalies(anom);
            setTypes(t);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = filter ? anomalies.filter(a => a.anomalyType === filter) : anomalies;

    return (
        <div className="anomalies-page container">
            <h1 className="page-title animate-in">⚠️ Anomalies</h1>
            <p className="page-subtitle animate-in stagger-1">
                Flagged irregularities in analyzed government financial data
            </p>

            {types.length > 0 && (
                <div className="anomaly-filters animate-in stagger-2">
                    <button className={`filter-chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>
                        All ({anomalies.length})
                    </button>
                    {types.map(t => (
                        <button
                            key={t}
                            className={`filter-chip ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t} ({anomalies.filter(a => a.anomalyType === t).length})
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="skeleton-list">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton anomaly-skeleton" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state card animate-in">
                    <div className="empty-icon">🔍</div>
                    <h3>No Anomalies Found</h3>
                    <p>Upload financial documents to start detecting irregularities in government spending.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/upload')}>Upload Document</button>
                </div>
            ) : (
                <div className="anomalies-list">
                    {filtered.map((a, i) => (
                        <div key={a.id} className={`animate-in stagger-${(i % 4) + 1}`}>
                            <AnomalyCard
                                anomaly={a}
                                onReview={() => { }}
                                onGenerateRTI={() => navigate('/rti-workspace', { state: { anomalyId: a.id } })}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
