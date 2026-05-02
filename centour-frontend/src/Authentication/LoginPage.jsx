// LoginPage.jsx
import './LoginPage.css';
import { useState } from 'react';

export default function LoginPage(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [loading, setLoading] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const url = isLoggingIn ? `${apiUrl}/login` : `${apiUrl}/register`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLoggingIn) {
                    localStorage.setItem('access_token', data.access_token || data.token);
                    props.loggedIn?.(true);
                } else {
                    await autoLogin(email, password);
                }
            } else {
                setError(data.message || data.error || data.detail || 'Operation failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const autoLogin = async (email, password) => {
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token || data.token);
                props.loggedIn?.(true);
            } else {
                setError(data.message || data.error || 'Login failed after registration');
            }
        } catch (err) {
            setError('Auto-login failed. Please log in manually.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <div className="login-logo-dot" />
                    </div>
                    <span className="login-logo-name">
                        centour<span>.ai</span>
                    </span>
                </div>

                {/* Heading */}
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

                    {/* Username only shown during registration */}
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

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={loading}
                    >
                        {isLoggingIn
                            ? (loading ? 'Signing in...' : 'Sign in')
                            : (loading ? 'Creating account...' : 'Create account')}
                    </button>
                </form>

                {/* Divider + toggle */}
                <div className="divider"><span>or</span></div>

                <button
                    className="secondary-btn"
                    onClick={() => {
                        setIsLoggingIn(!isLoggingIn);
                        setError('');
                    }}
                >
                    {isLoggingIn
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in'}
                </button>

            </div>
        </div>
    );
}