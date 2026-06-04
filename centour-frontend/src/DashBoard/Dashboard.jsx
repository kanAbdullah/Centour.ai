import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-center">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <div className="dashboard-logo-dot" />
          </div>
        </div>
        <h1 className="dashboard-title">centour<span>.ai</span></h1>
        <p className="dashboard-subtitle">Select a chat from the sidebar to get started.</p>
      </div>
    </div>
  );
}
