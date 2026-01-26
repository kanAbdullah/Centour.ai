import { useState, useEffect } from 'react'
import './App.css'

import Sidebar from './Sidebar/Sidebar';
import ChatView from './Chat/ChatView';
import LoginPage from './Authentication/LoginPage';
import Dashboard from './DashBoard/Dashboard.jsx';
import { api, getAccess, clearTokens } from './api/ApiClient.jsx';

function App() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAccess();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    api.get("/verify")
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearTokens();
        setIsAuthenticated(false);
      })
      .finally(() => {
      });
  }, []);

  return (
    isAuthenticated ? (
      <>
        <Sidebar
          onSelectChat={setSelectedChatId}
          resetChat={() => setSelectedChatId(null)}
        />
        <div >
          {selectedChatId ? (<ChatView chatId={selectedChatId} />) : (<Dashboard />)}
        </div>
      </>
    ) :
      (<LoginPage loggedIn={() => setIsAuthenticated(true)} />)
  )
}

export default App
