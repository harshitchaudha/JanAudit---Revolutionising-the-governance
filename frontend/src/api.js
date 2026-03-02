const API_BASE = 'http://localhost:8000';

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'API request failed');
    }
    return res.json();
}

export const api = {
    // Dashboard
    getStats: () => request('/api/dashboard/stats'),
    getSpendingByCategory: () => request('/api/charts/spending-by-category'),
    getSpendingByDepartment: () => request('/api/charts/spending-by-department'),

    // Documents
    getDocuments: () => request('/api/documents'),
    getDocument: (id) => request(`/api/documents/${id}`),
    uploadDocument: (file) => {
        const form = new FormData();
        form.append('file', file);
        return fetch(`${API_BASE}/api/documents/upload`, { method: 'POST', body: form })
            .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            });
    },

    // Anomalies
    getAnomalies: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/anomalies${qs ? '?' + qs : ''}`);
    },
    getAnomaly: (id) => request(`/api/anomalies/${id}`),
    getAnomalyTypes: () => request('/api/anomalies/types'),

    // RTI
    generateDraft: (anomalyId) => request('/api/rti/generate', {
        method: 'POST',
        body: JSON.stringify({ anomalyId }),
    }),
    getDrafts: () => request('/api/rti/drafts'),
    getDraft: (id) => request(`/api/rti/drafts/${id}`),
    getLegalContext: (query) => request(`/api/rti/legal-context?query=${encodeURIComponent(query)}`),
};
