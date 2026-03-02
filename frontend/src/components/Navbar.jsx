import { NavLink } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';
import './Navbar.css';

const NAV_LINKS = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/upload', label: 'Upload', icon: '📤' },
    { to: '/anomalies', label: 'Anomalies', icon: '⚠️' },
    { to: '/rti-workspace', label: 'RTI Workspace', icon: '📝' },
    { to: '/about', label: 'About', icon: 'ℹ️' },
];

const PERSONAS = ['Citizen', 'Journalist', 'NGO', 'Researcher'];

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const [persona, setPersona] = useState('Citizen');
    const [mobileOpen, setMobileOpen] = useState(false);

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
                    {NAV_LINKS.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-actions">
                    <select
                        className="persona-select"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                    >
                        {PERSONAS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </nav>
    );
}
