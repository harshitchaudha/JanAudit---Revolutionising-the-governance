import { useState, useEffect } from 'react';
import { api } from '../api';
import FileUpload from '../components/FileUpload';
import './Upload.css';

export default function Upload() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { loadDocuments(); }, []);

    const loadDocuments = async () => {
        try {
            const docs = await api.getDocuments();
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file) => {
        const result = await api.uploadDocument(file);
        setTimeout(loadDocuments, 1000);
        return result;
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        setDeletingId(id);
        try {
            await api.deleteDocument(id);
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete document. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const statusIcon = (status) => {
        switch (status) {
            case 'completed': return '✅';
            case 'processing': return '⏳';
            case 'failed': return '❌';
            default: return '❓';
        }
    };

    return (
        <div className="upload-page container">
            <h1 className="page-title animate-in">📤 Upload & Processing</h1>
            <p className="page-subtitle animate-in stagger-1">Upload government financial documents for AI-powered analysis</p>

            <div className="upload-area animate-in stagger-2">
                <FileUpload onUpload={handleUpload} />
            </div>

            <section className="documents-section animate-in stagger-3">
                <h2>Uploaded Documents</h2>
                {loading ? (
                    <div className="skeleton-list">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton doc-skeleton" />)}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="empty-state card">
                        <p>No documents uploaded yet. Upload a PDF to start analyzing.</p>
                    </div>
                ) : (
                    <div className="documents-list">
                        {documents.map(doc => (
                            <div key={doc.id} className="document-row card">
                                <div className="doc-info">
                                    <span className="doc-status">{statusIcon(doc.status)}</span>
                                    <div className="doc-details">
                                        <span className="doc-name">{doc.fileName}</span>
                                        <span className="doc-meta">
                                            {doc.sourceDepartment} · {new Date(doc.uploadDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="doc-actions">
                                    <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingId === doc.id}
                                        title="Delete document"
                                    >
                                        {deletingId === doc.id ? '⏳' : '🗑️'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}