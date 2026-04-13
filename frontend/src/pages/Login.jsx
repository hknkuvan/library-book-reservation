import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.success) {
        // Redirect based on role
        if (result.user.role === 'system_admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>📚</span>
        </div>
        <h1 className="card-title" style={{ textAlign: 'center' }}>Welcome Back</h1>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>
          Sign in to access your library account
        </p>

        {error && (
          <div className="alert alert-error" id="login-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              className={`form-input ${error && !email ? 'error' : ''}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              className={`form-input ${error && !password ? 'error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="btn-login"
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <Link to="/forgot-password" id="link-forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Forgot Password?
          </Link>
        </div>

        <div className="form-footer">
          Don't have an account?{' '}
          <Link to="/register" id="link-register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
