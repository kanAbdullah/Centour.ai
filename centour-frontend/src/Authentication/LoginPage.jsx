import './LoginPage.css';
import { useState } from 'react';

export default function LoginPage(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoginningIn, setIsLoggingIn] = useState(true);
    const [loading, setLoading] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL;
    console.log('API URL:', apiUrl);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        let url = ``;
        if (isLoginningIn) {
            url = `${apiUrl}/login`;
        } else {
            url = `${apiUrl}/register`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            console.log('Response status:', response.status);
            console.log('Response data:', data);

            if (response.ok) {
                if (isLoginningIn) {
                    // Login işlemi başarılı, tokeni kaydet
                    if (data.access_token || data.token) {
                        localStorage.setItem('access_token', data.access_token || data.token);
                    }
                    props.loggedIn?.(true);
                } else {
                    // Register işlemi başarılı, otomatik giriş yap
                    console.log('Registration successful, logging in...');
                    await autoLogin(email, password);
                }
            } else {
                setError(data.message || data.error || data.detail || 'Operation failed');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Otomatik giriş fonksiyonu
    const autoLogin = async (email, password) => {
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.access_token || data.token) {
                    localStorage.setItem('access_token', data.access_token || data.token);
                    props.loggedIn?.(true);
                }
            } else {
                setError(data.message || data.error || data.detail || 'Login failed after registration');
            }
        } catch (err) {
            console.error('Auto-login error:', err);
            setError('An error occurred during auto-login. Please try logging in manually.');
        }
    };

    return (
    <div className="login-container">
        <div className="login-card">
            <h2>{isLoginningIn ? "Login" : "Sign Up"}</h2>

            <form onSubmit={handleSubmit}> {/* Button onClick yerine form onSubmit daha sağlıklıdır */}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text" // type="username" yerine "text" kullanmalısın
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <button
                    type="submit" // handleSubmit'i tetikler
                    className="primary-btn"
                    disabled={loading}
                >
                    {isLoginningIn
                        ? (loading ? 'Logging in...' : 'Login')
                        : (loading ? 'Signing up...' : 'Sign Up')}
                </button>
            </form>

            <button
                className="secondary-btn"
                onClick={() => setIsLoggingIn(!isLoginningIn)}
            >
                {isLoginningIn ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
        </div>
    </div>
);
}