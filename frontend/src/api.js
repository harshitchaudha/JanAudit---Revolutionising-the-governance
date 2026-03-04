// Base URL for the API. Change to your production URL when deployed.
const API_BASE = 'http://localhost:8000';

/**
 * Generic helper to perform API requests.
 * - Builds full URL from base + path
 * - Merges provided headers with default Content-Type
 * - Supports passing additional fetch options (method, body, etc.)
 * - Centralized error handling: throws an Error with a meaningful detail
 *
 * @param {string} path - API path, e.g. '/api/dashboard/stats'
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - Parsed JSON response
 */
async function request(path, options = {}) {
    // Construct the full URL
    const url = `${API_BASE}${path}`;

    // Perform the HTTP request with default headers
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    // If response is not OK (status 4xx/5xx), try to extract a usable error message
    if (!res.ok) {
        // Try to parse JSON error body; fall back to statusText if parsing fails
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'API request failed');
    }

    // Return parsed JSON body on success
    return res.json();
}

/**
 * API facade exposing named endpoints for the application.
 * Each method returns a promise resolving to the parsed JSON data.
 */
export const api = {
    // Dashboard
    // Fetch general statistics for the dashboard
    getStats: () => request('/api/dashboard/stats'),

    // Spending charts
    // Spending aggregated by category
    getSpendingByCategory: () => request('/api/charts/spending-by-category'),

    // Spending aggregated by department
    getSpendingByDepartment: () => request('/api/charts/spending-by-department'),

    // Documents
    // Retrieve a list of documents
    getDocuments: () => request('/api/documents'),

    // Retrieve a single document by ID
    getDocument: (id) => request(`/api/documents/${id}`),

    // Upload a document file
    uploadDocument: (file) => {
        // Use FormData to send multipart/form-data
        const form = new FormData();
        form.append('file', file);

        // Note: This endpoint uses a different content type (multipart/form-data)
        // We bypass the default request helper to accommodate FormData
        return fetch(`${API_BASE}/api/documents/upload`, { method: 'POST', body: form })
            .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            });
    },

    // Anomalies
    // Retrieve a list of anomalies with optional query params
    getAnomalies: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/anomalies${qs ? '?' + qs : ''}`);
    },

    // Retrieve a single anomaly by ID
    getAnomaly: (id) => request(`/api/anomalies/${id}`),

    // Retrieve available anomaly types
    getAnomalyTypes: () => request('/api/anomalies/types'),

    // RTI (Right To Information)
    // Generate a draft for a given anomaly
    generateDraft: (anomalyId) => request('/api/rti/generate', {
        method: 'POST',
        body: JSON.stringify({ anomalyId }),
    }),

    // Retrieve all RTI drafts
    getDrafts: () => request('/api/rti/drafts'),

    // Retrieve a specific RTI draft by ID
    getDraft: (id) => request(`/api/rti/drafts/${id}`),

    // Retrieve legal context for RTI with a query string
    getLegalContext: (query) => request(`/api/rti/legal-context?query=${encodeURIComponent(query)}`),
};
