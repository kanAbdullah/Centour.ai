import { useState, useEffect } from 'react'
import './App.css'

import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './Sidebar/Sidebar';
import ChatView from './Chat/ChatView';
import LoginPage from './Authentication/LoginPage';
import Dashboard from './DashBoard/Dashboard.jsx';
import { api, getAccess, clearTokens } from './api/ApiClient.jsx';

function AppContent() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAccess();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    api.get("/verify")
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        clearTokens();
        setIsAuthenticated(false);
      });
  }, []);

  function handleLogout() {
    clearTokens();
    setIsAuthenticated(false);
    setSelectedChatId(null);
  }

  return (
    isAuthenticated ? (
      <div className="app-layout">
        <Sidebar
          onSelectChat={setSelectedChatId}
          resetChat={() => setSelectedChatId(null)}
          onLogout={handleLogout}
        />
        <div className="app-main">
          {selectedChatId !== null ? <ChatView chatId={selectedChatId} /> : <Dashboard />}
        </div>
      </div>
    ) : (
      <LoginPage loggedIn={() => setIsAuthenticated(true)} />
    )
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
