import { useEffect, useState } from "react";
import { api } from "../api";
import "./Documents.css";

export default function Documents() {

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // Fetch documents
    const loadDocuments = async () => {
        try {
            const data = await api.getDocuments();
            setDocuments(data);
        } catch (err) {
            console.error("Failed to load documents:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // Delete document
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Delete this document and ALL related anomalies?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(id);

            await api.deleteDocument(id);

            // Update UI instantly
            setDocuments((docs) => docs.filter((doc) => doc.id !== id));

        } catch (err) {
            alert("Failed to delete document: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="docs-loading">
                <div className="loader"></div>
                Loading documents...
            </div>
        );
    }

    return (
        <div className="docs-page">

            <h1 className="docs-title">
                📄 Uploaded Documents
            </h1>

            {documents.length === 0 ? (
                <div className="docs-empty">
                    No documents uploaded yet.
                </div>
            ) : (

                <div className="docs-grid">

                    {documents.map((doc) => (
                        <div key={doc.id} className="doc-card">

                            <div className="doc-header">

                                <span className="doc-name">
                                    {doc.fileName}
                                </span>

                                <span className={`doc-status ${doc.status}`}>
                                    {doc.status}
                                </span>

                            </div>

                            <div className="doc-info">

                                <p>
                                    📅 Uploaded:
                                    <br />
                                    {new Date(doc.uploadDate).toLocaleString()}
                                </p>

                                <p>
                                    🏛 Department:
                                    <br />
                                    {doc.sourceDepartment || "Unknown"}
                                </p>

                            </div>

                            <div className="doc-actions">

                                <button
                                    className="btn-view"
                                    onClick={() => window.location.href = `/anomalies?documentId=${doc.id}`}
                                >
                                    View Anomalies
                                </button>

                                <button
                                    className="btn-delete"
                                    disabled={deletingId === doc.id}
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    {deletingId === doc.id
                                        ? "Deleting..."
                                        : "🗑 Delete"}
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}