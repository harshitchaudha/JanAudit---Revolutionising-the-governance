// Base URL for the API
const API_BASE = 'http://localhost:8000';

// Attach Authorization header automatically
function authHeaders(token) {
    if (token) return { 'Authorization': `Bearer ${token}` };
    const stored = localStorage.getItem('janaudit_token');
    return stored ? { 'Authorization': `Bearer ${stored}` } : {};
}

// Generic API request helper
async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(options.token),
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "API request failed");
    }

    return res.json();
}

export const api = {
    // ───────────────────────────────────────────────
    // AUTH
    // ───────────────────────────────────────────────
    login: (email, password) => request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),

    register: (email, password, fullName, role) =>
        request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName, role }),
        }),

    getMe: (token) => request('/api/auth/me', { token }),

    getUsers: () => request('/api/auth/users'),

    // ───────────────────────────────────────────────
    // DASHBOARD
    // ───────────────────────────────────────────────
    getStats: () => request('/api/dashboard/stats'),
    getSpendingByCategory: () => request('/api/charts/spending-by-category'),
    getSpendingByDepartment: () => request('/api/charts/spending-by-department'),

    // ───────────────────────────────────────────────
    // DOCUMENTS
    // ───────────────────────────────────────────────
    getDocuments: () => request('/api/documents'),

    getDocument: (id) => request(`/api/documents/${id}`),

    uploadDocument: (file) => {
        const form = new FormData();
        form.append('file', file);

        const token = localStorage.getItem('janaudit_token');

        return fetch(`${API_BASE}/api/documents/upload`, {
            method: 'POST',
            body: form,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).then(res => {
            if (!res.ok) throw new Error("Upload failed");
            return res.json();
        });
    },

    // ⭐ NEW: DELETE DOCUMENT ⭐
    deleteDocument: (id) =>
        request(`/api/documents/${id}`, {
            method: 'DELETE',
        }),

    // ───────────────────────────────────────────────
    // ANOMALIES
    // ───────────────────────────────────────────────
    getAnomalies: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/anomalies${qs ? `?${qs}` : ''}`);
    },

    getAnomaly: (id) => request(`/api/anomalies/${id}`),

    getAnomalyTypes: () => request('/api/anomalies/types'),

    // ⭐ NEW: DELETE ANOMALY ⭐
    deleteAnomaly: (id) =>
        request(`/api/anomalies/${id}`, {
            method: 'DELETE',
        }),

    // ───────────────────────────────────────────────
    // RTI WORKSPACE
    // ───────────────────────────────────────────────
    generateDraft: (anomalyId) =>
        request('/api/rti/generate', {
            method: 'POST',
            body: JSON.stringify({ anomalyId }),
        }),

    getDrafts: () => request('/api/rti/drafts'),

    getDraft: (id) => request(`/api/rti/drafts/${id}`),

    getLegalContext: (query) =>
        request(`/api/rti/legal-context?query=${encodeURIComponent(query)}`),
};