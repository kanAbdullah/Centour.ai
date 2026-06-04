import './Sidebar.css';
import SidebarBottomMenu from "./SidebarBottomMenu";
import SideBarContentController from "./SideBarContentController";

export default function Sidebar({ onSelectChat, resetChat, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <div className="sidebar-brand-dot" />
        </div>
        <span className="sidebar-brand-name">
          centour<span>.ai</span>
        </span>
      </div>
      <div className="sidebar-content">
        <SideBarContentController onSelectChat={onSelectChat} />
      </div>
      <SidebarBottomMenu resetChat={resetChat} onLogout={onLogout} />
    </div>
  );
}
