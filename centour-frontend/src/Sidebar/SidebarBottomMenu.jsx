import { useState } from 'react';
import './SidebarBottomMenu.css';
import { clearTokens } from "../api/ApiClient";
import { useTheme } from '../context/ThemeContext';
import SettingsModal from './SettingsModal.jsx';

export default function SidebarBottomMenu({ resetChat, onLogout }) {
  const { theme, toggle } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  function handleLogout() {
    clearTokens();
    onLogout?.();
  }

  return (
    <div className="sidebar-bottom">
      <div className="theme-toggle-row">
        <span className="theme-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        <button className={`theme-pill ${theme}`} onClick={toggle} aria-label="Toggle theme">
          <span className="theme-pill-thumb" />
        </button>
      </div>

      <button className="sidebar-bottom-btn" onClick={resetChat}>Dashboard</button>
      <button className="sidebar-bottom-btn" onClick={() => setShowSettings(true)}>Settings</button>
      <button className="sidebar-bottom-btn logout" onClick={handleLogout}>Logout</button>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
