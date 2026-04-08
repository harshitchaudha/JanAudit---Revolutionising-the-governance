import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('janaudit_token'));
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        if (token) {
            api.getMe(token)
                .then(u => setUser(u))
                .catch(() => { setToken(null); localStorage.removeItem('janaudit_token'); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        const t = data.accessToken || data.token;
        localStorage.setItem('janaudit_token', t);
        setToken(t);
        const me = await api.getMe(t);
        setUser(me);
        return me;
    };

    const register = async (email, password, fullName, role) => {
        await api.register(email, password, fullName, role);
        return login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('janaudit_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
