import { useState, useRef } from 'react';
import './FileUpload.css';

export default function FileUpload({ onUpload, compact = false }) {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputRef = useRef();

    const handleFiles = async (files) => {
        const file = files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file.');
            return;
        }

        setError('');
        setSuccess('');
        setUploading(true);
        setProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 90) { clearInterval(progressInterval); return 90; }
                return p + Math.random() * 15;
            });
        }, 200);

        try {
            const result = await onUpload(file);
            clearInterval(progressInterval);
            setProgress(100);
            setSuccess(`"${file.name}" uploaded successfully! Processing...`);
            setTimeout(() => { setProgress(0); setSuccess(''); }, 3000);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err.message || 'Upload failed.');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div
            className={`file-upload ${dragOver ? 'drag-over' : ''} ${compact ? 'compact' : ''} ${uploading ? 'uploading' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFiles(e.target.files)}
                hidden
            />

            <div className="upload-content">
                <div className="upload-icon">{uploading ? '⏳' : '📄'}</div>
                <div className="upload-text">
                    <p className="upload-title">
                        {uploading ? 'Processing document...' : 'Drop your PDF here or click to browse'}
                    </p>
                    {!compact && (
                        <p className="upload-subtitle">Government financial reports, audit documents, expenditure statements</p>
                    )}
                </div>
            </div>

            {progress > 0 && (
                <div className="upload-progress-track">
                    <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                </div>
            )}

            {error && <div className="upload-error">⚠️ {error}</div>}
            {success && <div className="upload-success">✅ {success}</div>}
        </div>
    );
}
