import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Login.css';

const ROLES = [
    { value: 'citizen', label: '🏠 Citizen', desc: 'Upload reports & view anomalies' },
    { value: 'journalist', label: '📰 Journalist', desc: 'Full access including RTI workspace' },
];

export default function Login() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password, fullName, role);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container glass">
                <div className="login-header">
                    <span className="login-icon">⚖️</span>
                    <h1>JanAudit</h1>
                    <p className="login-subtitle">AI-Powered Government Transparency</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); setError(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); setError(''); }}
                    >
                        Create Account
                    </button>
                </div>

                {error && <div className="login-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                placeholder="Your full name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={4}
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Account Type</label>
                            <div className="role-selector">
                                {ROLES.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        className={`role-card ${role === r.value ? 'selected' : ''}`}
                                        onClick={() => setRole(r.value)}
                                    >
                                        <span className="role-label">{r.label}</span>
                                        <span className="role-desc">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                        {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                    </button>
                </form>

                {mode === 'login' && (
                    <div className="login-hint">
                        <p>🔑 Admin: <code>admin@janaudit.in</code> / <code>admin123</code></p>
                    </div>
                )}
            </div>
        </div>
    );
}
