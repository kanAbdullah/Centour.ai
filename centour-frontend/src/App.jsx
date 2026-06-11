import { useState, useEffect } from 'react'
import './App.css'

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './Sidebar/Sidebar';
import ChatView from './Chat/ChatView';
import LoginPage from './Authentication/LoginPage';
import Dashboard from './DashBoard/Dashboard.jsx';
import { api, getAccess, clearTokens } from './api/ApiClient.jsx';

function AppContent() {
  const [selectedChat, setSelectedChat] = useState(null);
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
    setSelectedChat(null);
  }

  return (
    isAuthenticated ? (
      <div className="app-layout">
        <Sidebar
          onSelectChat={setSelectedChat}
          resetChat={() => setSelectedChat(null)}
          onLogout={handleLogout}
          activeChat={selectedChat}
        />
        <div className="app-main">
          {selectedChat ? <ChatView chatId={selectedChat.id} chatPath={selectedChat} /> : <Dashboard />}
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
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
