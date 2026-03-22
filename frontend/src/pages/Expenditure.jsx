import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { api } from '../api';
import './Expenditure.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Expenditure() {
    const [categoryData, setCategoryData] = useState(null);
    const [deptData, setDeptData] = useState(null);
    const [chartFilter, setChartFilter] = useState('category');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [cat, dept] = await Promise.all([
                api.getSpendingByCategory(),
                api.getSpendingByDepartment(),
            ]);
            setCategoryData(cat);
            setDeptData(dept);
        } catch (err) {
            console.error('Expenditure load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const textColor  = 'rgba(255,255,255,0.45)';
    const gridColor  = 'rgba(255,255,255,0.05)';
    const chartColors = ['#FF9933','#4CAF50','#64B5F6','#f59e0b','#CE93D8','#38b2ac','#dd6b20','#667eea','#e74c3c','#3498db'];

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
            borderColor: 'rgba(2,6,23,0.8)',
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(2,6,23,0.95)',
                titleColor: '#fff',
                bodyColor: 'rgba(255,255,255,0.55)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                cornerRadius: 10,
                padding: 12,
            }
        },
        scales: {
            x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: 'rgba(255,255,255,0.45)', padding: 16, font: { size: 11 } }
            }
        }
    };

    if (loading) {
        return (
            <div className="exp-page container">
                <div className="exp-header">
                    <div className="exp-tricolor" />
                    <h1 className="exp-title">Expenditure Analysis</h1>
                </div>
                <div className="exp-skeleton-grid">
                    {[1, 2].map(i => <div key={i} className="skeleton exp-skeleton" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="exp-page container">

            {/* Header */}
            <div className="exp-header animate-in">
                <div className="exp-tricolor" />
                <div>
                    <h1 className="exp-title">Expenditure Analysis</h1>
                    <p className="exp-subtitle">Visual breakdown of government spending patterns</p>
                </div>
                <div className="exp-filters">
                    <button
                        className={`filter-btn ${chartFilter === 'category' ? 'active' : ''}`}
                        onClick={() => setChartFilter('category')}
                    >
                        By Category
                    </button>
                    <button
                        className={`filter-btn ${chartFilter === 'department' ? 'active' : ''}`}
                        onClick={() => setChartFilter('department')}
                    >
                        By Department
                    </button>
                </div>
            </div>

            {!activeData || activeData.labels.length === 0 ? (
                <div className="empty-state animate-in">
                    <div className="empty-icon">📊</div>
                    <h3>No Expenditure Data</h3>
                    <p>Upload a government financial document to see spending analysis.</p>
                </div>
            ) : (
                <>
                    {/* Charts grid */}
                    <div className="exp-charts-grid animate-in stagger-1">
                        <div className="exp-chart-card">
                            <div className="exp-chart-bar" style={{ background: '#FF9933' }} />
                            <h3 className="exp-chart-title">Spending Breakdown</h3>
                            <div className="exp-chart-wrapper">
                                {barData && <Bar data={barData} options={chartOptions} />}
                            </div>
                        </div>

                        <div className="exp-chart-card">
                            <div className="exp-chart-bar" style={{ background: '#4CAF50' }} />
                            <h3 className="exp-chart-title">Distribution</h3>
                            <div className="exp-chart-wrapper">
                                {pieData && <Pie data={pieData} options={pieOptions} />}
                            </div>
                        </div>
                    </div>

                    {/* Summary table */}
                    <div className="exp-table-card animate-in stagger-2">
                        <div className="exp-chart-bar" style={{ background: '#64B5F6' }} />
                        <h3 className="exp-table-title">Breakdown Summary</h3>
                        <div className="exp-table-wrap">
                            <table className="exp-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{chartFilter === 'category' ? 'Category' : 'Department'}</th>
                                        <th>Amount</th>
                                        <th>Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeData.labels.map((label, i) => {
                                        const total = activeData.values.reduce((a, b) => a + b, 0);
                                        const pct = total > 0 ? ((activeData.values[i] / total) * 100).toFixed(1) : '0.0';
                                        const val = activeData.values[i];
                                        const formatted = val >= 10000000
                                            ? `₹${(val/10000000).toFixed(1)}Cr`
                                            : val >= 100000
                                            ? `₹${(val/100000).toFixed(1)}L`
                                            : `₹${val.toLocaleString('en-IN')}`;
                                        return (
                                            <tr key={label}>
                                                <td>
                                                    <span className="exp-table-dot" style={{ background: chartColors[i % chartColors.length] }} />
                                                </td>
                                                <td>{label}</td>
                                                <td className="exp-table-amount">{formatted}</td>
                                                <td>
                                                    <div className="exp-share-wrap">
                                                        <div className="exp-share-bar">
                                                            <div
                                                                className="exp-share-fill"
                                                                style={{ width: `${pct}%`, background: chartColors[i % chartColors.length] }}
                                                            />
                                                        </div>
                                                        <span className="exp-share-pct">{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom label */}
            <div className="dash-bottom-label animate-in">
                <div className="dash-bottom-line" />
                <span>RTI Act 2005 Compliant · Built for Citizens</span>
                <div className="dash-bottom-line" />
            </div>
        </div>
    );
}