import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email });
      if (res.data.success) {
        setSuccess(true);
        setResetUrl(res.data.resetUrl || '');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Request failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📧</span>
          </div>
          <h1 className="card-title" style={{ textAlign: 'center' }}>Check Your Email</h1>
          <p className="card-subtitle" style={{ textAlign: 'center' }}>
            If an account with that email exists, a password reset link has been sent.
          </p>

          <div className="alert alert-success" style={{ justifyContent: 'center' }}>
            <span className="alert-icon">✅</span>
            Password reset link generated!
          </div>

          {resetUrl && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                📝 Demo Mode - Reset Link:
              </p>
              <a href={resetUrl} style={{ color: 'var(--primary-400)' }}>{resetUrl}</a>
            </div>
          )}

          <div className="form-footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/login" id="link-back-login">← Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔑</span>
        </div>
        <h1 className="card-title" style={{ textAlign: 'center' }}>Forgot Password</h1>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="alert alert-error" id="forgot-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="forgot-password-form">
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">Email Address</label>
            <input
              type="email"
              id="forgot-email"
              className={`form-input ${error && !email ? 'error' : ''}`}
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="btn-forgot-submit"
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="form-footer">
          Remember your password?{' '}
          <Link to="/login" id="link-back-login-2">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
