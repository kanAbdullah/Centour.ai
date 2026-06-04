import './SidebarBottomMenu.css';
import { clearTokens } from "../api/ApiClient";
import { useTheme } from '../context/ThemeContext';

export default function SidebarBottomMenu({ resetChat, onLogout }) {
  const { theme, toggle } = useTheme();

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
      <button className="sidebar-bottom-btn">Settings</button>
      <button className="sidebar-bottom-btn logout" onClick={handleLogout}>Logout</button>
    </div>
  );
}
