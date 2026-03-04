import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { useState } from 'react';
import './Navbar.css';

const ROLE_BADGE = {
    admin: { label: 'Admin', color: '#ef4444' },
    journalist: { label: 'Journalist', color: '#3b82f6' },
    citizen: { label: 'Citizen', color: '#22c55e' },
};

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Build nav links based on user role
    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/upload', label: 'Upload', icon: '📤' },
        { to: '/anomalies', label: 'Anomalies', icon: '⚠️' },
    ];

    // RTI Workspace only for journalist & admin
    if (user && (user.role === 'journalist' || user.role === 'admin')) {
        links.push({ to: '/rti-workspace', label: 'RTI Workspace', icon: '📝' });
    }

    links.push({ to: '/about', label: 'About', icon: 'ℹ️' });

    const badge = user ? ROLE_BADGE[user.role] || ROLE_BADGE.citizen : null;

    return (
        <nav className="navbar glass">
            <div className="navbar-inner">
                <div className="navbar-brand">
                    <span className="brand-icon">⚖️</span>
                    <span className="brand-text">JanAudit</span>
                </div>

                <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? '✕' : '☰'}
                </button>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    {links.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-actions">
                    {user && badge && (
                        <div className="user-info">
                            <span className="user-name">{user.fullName}</span>
                            <span className="role-badge" style={{ background: badge.color }}>
                                {badge.label}
                            </span>
                        </div>
                    )}

                    <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <button className="logout-btn" onClick={handleLogout} title="Sign out">
                        🚪
                    </button>
                </div>
            </div>
        </nav>
    );
}
