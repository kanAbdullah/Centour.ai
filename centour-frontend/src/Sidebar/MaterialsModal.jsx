import { useEffect, useRef, useState } from 'react';
import { api } from '../api/ApiClient.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './MaterialsModal.css';

function fileIcon(contentType) {
  if (contentType === "application/pdf") return "📕";
  if (contentType?.includes("markdown")) return "📝";
  return "📄";
}

function formatFileSize(bytes) {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialsModal({ studyId, studyTitle, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get(`/studies/${studyId}/documents`);
        if (!cancelled) setDocuments(data);
      } catch {
        showToast("Failed to load materials.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [studyId, showToast]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(`/studies/${studyId}/documents`, formData);
      setDocuments(prev => [...prev, data]);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to upload document.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc) {
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setConfirmDeleteId(null);
    } catch {
      showToast("Failed to delete document.", "error");
    }
  }

  async function handleDownload(doc) {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download document.", "error");
    }
  }

  return (
    <div className="materials-overlay" onClick={onClose}>
      <div className="materials-modal" onClick={(e) => e.stopPropagation()}>
        <div className="materials-header">
          <h3>Materials{studyTitle ? ` · ${studyTitle}` : ""}</h3>
          <button className="materials-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <p className="materials-hint">
          Documents attached here are available to every chat in this study.
        </p>

        {loading ? (
          <p className="materials-loading">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="materials-empty">No materials yet.</p>
        ) : (
          <ul className="materials-list">
            {documents.map((doc) => (
              <li key={doc.id} className="materials-item">
                <span className="materials-icon">{fileIcon(doc.contentType)}</span>
                <div className="materials-info">
                  <span className="materials-filename">{doc.filename}</span>
                  <span className="materials-date">
                    {new Date(doc.createdAt).toLocaleDateString()}
                    {formatFileSize(doc.fileSize) && ` · ${formatFileSize(doc.fileSize)}`}
                  </span>
                </div>
                {confirmDeleteId === doc.id ? (
                  <span className="materials-confirm-delete">
                    <button className="materials-confirm-yes" onClick={() => handleDelete(doc)}>Yes</button>
                    <button className="materials-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                  </span>
                ) : (
                  <span className="materials-actions">
                    <button className="materials-download-btn" title="Download" onClick={() => handleDownload(doc)}>⬇</button>
                    <button className="materials-delete-btn" title="Delete" onClick={() => setConfirmDeleteId(doc.id)}>🗑</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="materials-file-input"
          onChange={handleFileChange}
        />
        <button className="materials-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "+ Upload material"}
        </button>
      </div>
    </div>
  );
}
