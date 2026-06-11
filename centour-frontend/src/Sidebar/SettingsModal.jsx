import { useEffect, useState } from 'react';
import { api } from '../api/ApiClient.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get('/me');
        if (!cancelled) setUser(data);
      } catch {
        showToast("Failed to load account info.", "error");
        onClose?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [onClose, showToast]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="settings-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {loading ? (
          <p className="settings-loading">Loading…</p>
        ) : user ? (
          <div className="settings-body">
            <div className="settings-field">
              <span className="settings-label">Username</span>
              <span className="settings-value">{user.username}</span>
            </div>
            <div className="settings-field">
              <span className="settings-label">Email</span>
              <span className="settings-value">{user.email}</span>
            </div>
            <div className="settings-field">
              <span className="settings-label">User ID</span>
              <span className="settings-value settings-id">{user.id}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
