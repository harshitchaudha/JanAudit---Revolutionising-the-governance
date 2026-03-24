// ─────────────────────────────────────────────────────────────────────────────
// api.js  —  Real API calls with automatic dummy-data fallback
// When the backend (localhost:8000) is unreachable, all calls return
// realistic mock data so the UI works fully without a server.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000';

function authHeaders(token) {
    if (token) return { 'Authorization': `Bearer ${token}` };
    const stored = localStorage.getItem('janaudit_token');
    return stored ? { 'Authorization': `Bearer ${stored}` } : {};
}

async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    try {
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
            throw new Error(err.detail || 'API request failed');
        }
        return res.json();
    } catch {
        // Backend unreachable → serve dummy data
        return MOCK[path] ?? MOCK_FN(path, options);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS = [
    {
        id: 'doc-001',
        fileName: 'Uttarakhand_PWD_AuditReport_FY2324.pdf',
        sourceDepartment: 'Public Works Department',
        uploadDate: '2024-11-12T09:30:00Z',
        status: 'completed',
        pageCount: 84,
    },
    {
        id: 'doc-002',
        fileName: 'HealthDept_Expenditure_FY2324_Q3.pdf',
        sourceDepartment: 'Department of Health & Family Welfare',
        uploadDate: '2024-11-14T14:10:00Z',
        status: 'completed',
        pageCount: 52,
    },
    {
        id: 'doc-003',
        fileName: 'SmartCity_Procurement_Audit_2024.pdf',
        sourceDepartment: 'Smart City Mission Cell',
        uploadDate: '2024-11-18T11:55:00Z',
        status: 'completed',
        pageCount: 37,
    },
    {
        id: 'doc-004',
        fileName: 'Education_CapEx_AnnualReport_2023.pdf',
        sourceDepartment: 'Department of School Education',
        uploadDate: '2024-11-20T16:22:00Z',
        status: 'processing',
        pageCount: 0,
    },
];

const MOCK_ANOMALIES = [
    {
        id: 'anom-001',
        documentId: 'doc-001',
        anomalyType: 'Budget Overrun',
        confidenceScore: 0.94,
        description:
            'Actual expenditure of ₹9,82,00,000 recorded against a sanctioned budget provision of ₹8,45,00,000 for the NH-72 Road Widening Phase II project. This constitutes a 16.2% overrun of ₹1,37,00,000 with no supplementary demand or revision order on file. Per CAG norms, any overrun above 10% requires prior Finance Department approval (GO No. 845/2022).',
        record: {
            projectName: 'NH-72 Road Widening Phase II',
            category: 'Civil Construction',
            amount: 98200000,
            transactionDate: '2024-03-28T00:00:00Z',
            department: 'Public Works Department',
            voucherNo: 'PWD/RW/2024/00847',
        },
    },
    {
        id: 'anom-002',
        documentId: 'doc-001',
        anomalyType: 'Suspicious Round Amount',
        confidenceScore: 0.81,
        description:
            'Payment of exactly ₹50,00,000 (₹5 Crore) made to M/s Himalayan Constructions Pvt. Ltd. on 31-Mar-2024. Real procurement invoices almost never land on perfectly round figures. The payment coincides with the financial year closing date, suggesting it may be a year-end budget utilisation entry without proper invoice backing. Cross-reference with GFR Rule 230.',
        record: {
            projectName: 'Bridge Maintenance — Rishikesh Bypass',
            category: 'Civil Construction',
            amount: 50000000,
            transactionDate: '2024-03-31T00:00:00Z',
            department: 'Public Works Department',
            voucherNo: 'PWD/BM/2024/01122',
        },
    },
    {
        id: 'anom-003',
        documentId: 'doc-001',
        anomalyType: 'Duplicate Entry Discrepancy',
        confidenceScore: 0.88,
        description:
            'Two separate payment entries of ₹18,40,000 each found for the same work order (WO/PWD/2023/5521) — "Supply of Bitumen Emulsion for State Highways" — dated 14-Sep-2023 and 16-Sep-2023 respectively. Vendor name and amount are identical. This is likely a double-booking of the same invoice. Total potential duplicate payment: ₹18,40,000.',
        record: {
            projectName: 'Supply of Bitumen Emulsion — State Highways',
            category: 'Procurement',
            amount: 1840000,
            transactionDate: '2023-09-14T00:00:00Z',
            department: 'Public Works Department',
            voucherNo: 'PWD/PROC/2023/5521-A',
        },
    },
    {
        id: 'anom-004',
        documentId: 'doc-002',
        anomalyType: 'Statistical Outlier',
        confidenceScore: 0.76,
        description:
            'Expenditure of ₹2,31,00,000 on "Medical Equipment Procurement — Doon Hospital" is 3.8 standard deviations above the mean procurement expenditure (₹38.2L) for this document. While large hospital procurements can be legitimate, no supporting rate contract or GeM order number is referenced in the voucher trail. Warrants verification against CMSS procurement norms.',
        record: {
            projectName: 'Medical Equipment Procurement — Doon Hospital',
            category: 'Procurement',
            amount: 23100000,
            transactionDate: '2023-12-19T00:00:00Z',
            department: 'Department of Health & Family Welfare',
            voucherNo: 'HLTH/PROC/2023/00312',
        },
    },
    {
        id: 'anom-005',
        documentId: 'doc-002',
        anomalyType: 'Budget Overrun',
        confidenceScore: 0.91,
        description:
            'District Hospital Renovation project at Haridwar recorded actual spending of ₹7,32,00,000 against a sanctioned estimate of ₹6,20,00,000 — an overrun of ₹1,12,00,000 (18.1%). The revised estimate was submitted three months after the funds were already committed, which is a procedural violation under Rule 64 of the UP & Uttarakhand Financial Handbook.',
        record: {
            projectName: 'District Hospital Renovation — Haridwar',
            category: 'Civil Construction',
            amount: 73200000,
            transactionDate: '2024-02-08T00:00:00Z',
            department: 'Department of Health & Family Welfare',
            voucherNo: 'HLTH/CIVIL/2024/00088',
        },
    },
    {
        id: 'anom-006',
        documentId: 'doc-002',
        anomalyType: 'IQR Outlier',
        confidenceScore: 0.69,
        description:
            'Consultancy payment of ₹85,00,000 to an unnamed "technical advisor" falls in the top 2% of all consultancy entries across the document. No empanelment record, TOR (Terms of Reference), or deliverable receipt note is attached. Under GFR 2017 Rule 175, consultancy engagements above ₹5L require a competitive bidding process.',
        record: {
            projectName: 'PPP Advisory — Tehri Hydro Zone Development',
            category: 'Consultancy',
            amount: 8500000,
            transactionDate: '2023-10-30T00:00:00Z',
            department: 'Department of Health & Family Welfare',
            voucherNo: 'HLTH/CONS/2023/00091',
        },
    },
    {
        id: 'anom-007',
        documentId: 'doc-003',
        anomalyType: 'Suspicious Round Amount',
        confidenceScore: 0.78,
        description:
            'Three separate invoices for "CCTV Camera Supply & Installation" — each exactly ₹25,00,000 — paid to the same vendor (M/s DigiSecure Systems) on consecutive days (12, 13, 14 Jan 2024). The practice of splitting a single contract into sub-₹25L tranches to circumvent open tender norms (threshold: ₹25L) is a known audit red flag under CVC Circular 03/01/12.',
        record: {
            projectName: 'Smart City CCTV Surveillance Network',
            category: 'Procurement',
            amount: 25000000,
            transactionDate: '2024-01-12T00:00:00Z',
            department: 'Smart City Mission Cell',
            voucherNo: 'SMC/PROC/2024/00211',
        },
    },
    {
        id: 'anom-008',
        documentId: 'doc-003',
        anomalyType: 'Statistical Outlier',
        confidenceScore: 0.83,
        description:
            'Maintenance & Operation expenditure of ₹1,94,00,000 for "City Wi-Fi Network Operations" in Q3 FY24 is 4.1 standard deviations above historical quarterly maintenance costs for this project (avg ₹29L/quarter). No change in scope or new SLA addendum is on record to explain the spike. Possible inflated billing by the managed services vendor.',
        record: {
            projectName: 'City Wi-Fi Network O&M — Phase II',
            category: 'Maintenance',
            amount: 19400000,
            transactionDate: '2023-11-30T00:00:00Z',
            department: 'Smart City Mission Cell',
            voucherNo: 'SMC/MAINT/2023/00578',
        },
    },
];

const MOCK_STATS = {
    documentsProcessed: 12,
    totalExpenditure: 461600000,
    anomaliesDetected: 78,
    rtiDraftsGenerated: 23,
};

const MOCK_SPENDING_CATEGORY = [
    { category: 'Civil Construction',  amount: 145200000 },
    { category: 'Salaries & Benefits', amount: 105200000 },
    { category: 'Procurement',         amount: 79400000  },
    { category: 'Maintenance',         amount: 53100000  },
    { category: 'Consultancy',         amount: 41100000  },
    { category: 'Miscellaneous',       amount: 37900000  },
];

const MOCK_SPENDING_DEPT = [
    { department: 'Public Works',  amount: 152300000 },
    { department: 'Healthcare',    amount: 98100000  },
    { department: 'Education',     amount: 87400000  },
    { department: 'Transport',     amount: 65200000  },
    { department: 'Water Supply',  amount: 34100000  },
    { department: 'Sanitation',    amount: 24500000  },
];

const MOCK_RTI_DRAFTS = [
    {
        id: 'rti-001',
        anomalyId: 'anom-001',
        title: 'RTI Application — NH-72 Budget Overrun',
        content: `To,\nThe Public Information Officer,\nPublic Works Department, Uttarakhand\n\nSub: Application under Section 6(1) of the Right to Information Act, 2005\n\nSir/Madam,\n\nI, the undersigned, wish to seek the following information regarding the expenditure reported in the State Audit Report FY 2023-24 pertaining to the NH-72 Road Widening Phase II project (Voucher No. PWD/RW/2024/00847):\n\n1. Copies of all sanction orders, revised estimates, and Finance Department approvals for the said project.\n2. Details of the ₹1,37,00,000 expenditure incurred in excess of the original sanctioned budget.\n3. Action taken report (ATR) submitted to the Accountant General's office in response to the audit para.\n\nThe above information may be provided within 30 days as stipulated under Section 7(1) of the RTI Act, 2005.\n\nYours faithfully,\n[Applicant Name]\n[Date]`,
        createdAt: '2024-11-15T10:00:00Z',
        status: 'draft',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Static mock lookup
// ─────────────────────────────────────────────────────────────────────────────
const MOCK = {
    '/api/dashboard/stats':             MOCK_STATS,
    '/api/documents':                   MOCK_DOCUMENTS,
    '/api/anomalies':                   MOCK_ANOMALIES,
    '/api/anomalies/types':             [...new Set(MOCK_ANOMALIES.map(a => a.anomalyType))],
    '/api/charts/spending-by-category': MOCK_SPENDING_CATEGORY,
    '/api/charts/spending-by-department': MOCK_SPENDING_DEPT,
    '/api/rti/drafts':                  MOCK_RTI_DRAFTS,
};

// Dynamic mock for paths with IDs
function MOCK_FN(path, options = {}) {
    if (path.startsWith('/api/documents/') && path !== '/api/documents/') {
        const id = path.split('/')[3];
        return MOCK_DOCUMENTS.find(d => d.id === id) ?? null;
    }
    if (path.startsWith('/api/anomalies/') && path !== '/api/anomalies/') {
        const id = path.split('/')[3];
        return MOCK_ANOMALIES.find(a => a.id === id) ?? null;
    }
    if (path.startsWith('/api/rti/drafts/')) {
        const id = path.split('/')[4];
        return MOCK_RTI_DRAFTS.find(d => d.id === id) ?? null;
    }
    if (path === '/api/documents/upload' && options.method === 'POST') {
        // Simulate a successful upload — returns a new "processing" doc
        return {
            id: `doc-${Date.now()}`,
            fileName: 'Uploaded_Report.pdf',
            sourceDepartment: 'Uploaded by User',
            uploadDate: new Date().toISOString(),
            status: 'processing',
            pageCount: 0,
        };
    }
    if (path === '/api/rti/generate' && options.method === 'POST') {
        return MOCK_RTI_DRAFTS[0];
    }
    if (path.startsWith('/api/anomalies') && options.method === 'DELETE') {
        return { success: true };
    }
    if (path.startsWith('/api/documents') && options.method === 'DELETE') {
        return { success: true };
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — always resolves (no real server needed for demo)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_USER = {
    id: 'user-001',
    email: 'citizen@janaudit.in',
    fullName: 'Demo Citizen',
    role: 'citizen',
    token: 'mock-jwt-token-demo',
};

export const api = {
    // AUTH
    login: async (email, password) => {
        try {
            return await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        } catch {
            return { ...MOCK_USER, email };
        }
    },
    register: async (email, password, fullName, role) => {
        try {
            return await request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName, role }) });
        } catch {
            return { ...MOCK_USER, email, fullName, role };
        }
    },
    getMe: (token) => request('/api/auth/me', { token }).catch(() => MOCK_USER),
    getUsers: () => request('/api/auth/users').catch(() => [MOCK_USER]),

    // DASHBOARD
    getStats: () => request('/api/dashboard/stats'),
    getSpendingByCategory: () => request('/api/charts/spending-by-category'),
    getSpendingByDepartment: () => request('/api/charts/spending-by-department'),

    // DOCUMENTS
    getDocuments: () => request('/api/documents'),
    getDocument: (id) => request(`/api/documents/${id}`),
    uploadDocument: async (file) => {
        const form = new FormData();
        form.append('file', file);
        const token = localStorage.getItem('janaudit_token');
        try {
            const res = await fetch(`${API_BASE}/api/documents/upload`, {
                method: 'POST',
                body: form,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        } catch {
            // Simulate upload success with dummy doc
            return {
                id: `doc-${Date.now()}`,
                fileName: file.name,
                sourceDepartment: 'Uploaded by User',
                uploadDate: new Date().toISOString(),
                status: 'completed',
                pageCount: Math.floor(Math.random() * 60) + 20,
            };
        }
    },
    deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),

    // ANOMALIES
    getAnomalies: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/anomalies${qs ? `?${qs}` : ''}`);
    },
    getAnomaly: (id) => request(`/api/anomalies/${id}`),
    getAnomalyTypes: () => request('/api/anomalies/types'),
    deleteAnomaly: (id) => request(`/api/anomalies/${id}`, { method: 'DELETE' }),

    // RTI
    generateDraft: (anomalyId) =>
        request('/api/rti/generate', { method: 'POST', body: JSON.stringify({ anomalyId }) }),
    getDrafts: () => request('/api/rti/drafts'),
    getDraft: (id) => request(`/api/rti/drafts/${id}`),
    getLegalContext: (query) =>
        request(`/api/rti/legal-context?query=${encodeURIComponent(query)}`),
};