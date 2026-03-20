import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import './Sidebar.css';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/ask-audit', label: 'Ask the Audit', icon: '💬' },
    { to: '/data-tables', label: 'Data Tables', icon: '📋' },
    { to: '/visualizations', label: 'Visualizations', icon: '📈' },
    { to: '/anomalies', label: 'Anomaly Feed', icon: '⚠️' },
    { to: '/rti-workspace', label: 'RTI Workspace', icon: '📝' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to clear ALL data? This cannot be undone.")) {
            try {
                await api.resetDatabase();
                window.location.reload();
            } catch (err) {
                alert("Reset failed: " + err.message);
            }
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="brand-icon">⚖️</span>
                <span className="brand-text">JanAudit</span>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="link-icon">{item.icon}</span>
                        <span className="link-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/upload" className="upload-btn">
                     <span className="btn-icon">📤</span>
                     <span>Upload New Report</span>
                </NavLink>

                <div className="user-profile">
                    <div className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
                    <div className="user-details">
                        <div className="user-name">{user?.fullName || 'User'}</div>
                        <div className="user-role">{user?.role || 'Citizen'}</div>
                    </div>
                </div>

                <div className="footer-actions">
                    <button className="reset-btn" onClick={handleReset} title="Reset System">
                        🔄 Reset Data
                    </button>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}
