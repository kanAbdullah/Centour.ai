import './LoginPage.css';
import { useState } from 'react';
import { api, setAccess } from '../api/ApiClient.jsx';

export default function LoginPage({ loggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [loading, setLoading] = useState(false);

  async function doLogin(emailVal, passwordVal) {
    const { data } = await api.post('/login', { email: emailVal, password: passwordVal });
    setAccess(data.access_token || data.token);
    loggedIn?.();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoggingIn) {
        await doLogin(email, password);
      } else {
        await api.post('/register', { email, username, password });
        await doLogin(email, password);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.error || data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-logo">
          <div className="login-logo-icon">
            <div className="login-logo-dot" />
          </div>
          <span className="login-logo-name">
            centour<span>.ai</span>
          </span>
        </div>

        <h2>{isLoggingIn ? 'Welcome back' : 'Create account'}</h2>
        <p className="subtitle">
          {isLoggingIn
            ? 'Sign in to continue your conversation'
            : 'Join Centour and start chatting'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isLoggingIn && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {isLoggingIn
              ? (loading ? 'Signing in...' : 'Sign in')
              : (loading ? 'Creating account...' : 'Create account')}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button
          className="secondary-btn"
          onClick={() => { setIsLoggingIn(!isLoggingIn); setError(''); }}
        >
          {isLoggingIn
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>

      </div>
    </div>
  );
}
