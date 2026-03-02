import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import AnomalyCard from '../components/AnomalyCard';
import { api } from '../api';
import { useTheme } from '../ThemeContext';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [deptData, setDeptData] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [chartFilter, setChartFilter] = useState('category');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [s, cat, dept, anom] = await Promise.all([
                api.getStats(),
                api.getSpendingByCategory(),
                api.getSpendingByDepartment(),
                api.getAnomalies(),
            ]);
            setStats(s);
            setCategoryData(cat);
            setDeptData(dept);
            setAnomalies(anom.slice(0, 5));
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const textColor = theme === 'dark' ? '#cbd5e0' : '#4a5568';
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const chartColors = ['#38b249', '#4299e1', '#ed8936', '#e53e3e', '#9f7aea', '#38b2ac', '#dd6b20', '#667eea'];

    const activeData = chartFilter === 'category' ? categoryData : deptData;

    const barData = activeData ? {
        labels: activeData.labels,
        datasets: [{
            label: 'Expenditure (₹)',
            data: activeData.values,
            backgroundColor: chartColors.slice(0, activeData.labels.length),
            borderRadius: 6,
            borderSkipped: false,
        }]
    } : null;

    const pieData = activeData ? {
        labels: activeData.labels,
        datasets: [{
            data: activeData.values,
            backgroundColor: chartColors.slice(0, activeData.labels.length),
            borderWidth: 2,
            borderColor: theme === 'dark' ? '#162a4e' : '#ffffff',
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme === 'dark' ? '#0f1f3d' : '#ffffff',
                titleColor: theme === 'dark' ? '#f7fafc' : '#1a202c',
                bodyColor: textColor,
                borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
            }
        },
        scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } },
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: textColor, padding: 16, font: { size: 12 } }
            }
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toFixed(0)}`;
    };

    if (loading) {
        return (
            <div className="dashboard-page container">
                <h1 className="page-title">Dashboard</h1>
                <div className="metrics-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton metric-skeleton" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page container">
            <h1 className="page-title animate-in">📊 Dashboard</h1>
            <p className="page-subtitle animate-in stagger-1">Overview of analyzed government financial data</p>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <div className="animate-in stagger-1">
                    <MetricCard icon="📄" label="Documents Processed" value={stats?.documentsProcessed ?? 0} color="blue" />
                </div>
                <div className="animate-in stagger-2">
                    <MetricCard icon="💰" label="Total Expenditure" value={formatCurrency(stats?.totalExpenditure)} color="green" />
                </div>
                <div className="animate-in stagger-3">
                    <MetricCard icon="⚠️" label="Anomalies Detected" value={stats?.anomaliesDetected ?? 0} color="orange" />
                </div>
                <div className="animate-in stagger-4">
                    <MetricCard icon="📝" label="RTI Drafts Generated" value={stats?.rtiDraftsGenerated ?? 0} color="red" />
                </div>
            </div>

            {/* Charts Section */}
            {activeData && activeData.labels.length > 0 && (
                <section className="charts-section animate-in">
                    <div className="charts-header">
                        <h2>Expenditure Analysis</h2>
                        <div className="chart-filters">
                            <button className={`filter-btn ${chartFilter === 'category' ? 'active' : ''}`} onClick={() => setChartFilter('category')}>
                                By Category
                            </button>
                            <button className={`filter-btn ${chartFilter === 'department' ? 'active' : ''}`} onClick={() => setChartFilter('department')}>
                                By Department
                            </button>
                        </div>
                    </div>
                    <div className="charts-grid">
                        <div className="chart-card card">
                            <h3 className="chart-title">Spending Breakdown</h3>
                            <div className="chart-wrapper">
                                {barData && <Bar data={barData} options={chartOptions} />}
                            </div>
                        </div>
                        <div className="chart-card card">
                            <h3 className="chart-title">Distribution</h3>
                            <div className="chart-wrapper">
                                {pieData && <Pie data={pieData} options={pieOptions} />}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Anomaly Feed */}
            <section className="anomaly-feed animate-in">
                <div className="feed-header">
                    <h2>🔔 Recent Anomalies</h2>
                    {anomalies.length > 0 && (
                        <button className="btn btn-secondary" onClick={() => navigate('/anomalies')}>View All →</button>
                    )}
                </div>
                {anomalies.length === 0 ? (
                    <div className="empty-state card">
                        <p>No anomalies detected yet. Upload a financial document to get started.</p>
                    </div>
                ) : (
                    <div className="anomaly-list">
                        {anomalies.map((a, i) => (
                            <div key={a.id} className={`animate-in stagger-${i + 1}`}>
                                <AnomalyCard
                                    anomaly={a}
                                    onReview={() => navigate('/anomalies')}
                                    onGenerateRTI={() => navigate('/rti-workspace', { state: { anomalyId: a.id } })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
