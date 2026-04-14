import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function CreatePassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Reusing the reset-password endpoint as it serves the exact same purpose:
      // Verifying a token and setting a new password for that user.
      await axios.post(`${API}/auth/reset-password`, { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper glass-bg">
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
          <h1 className="card-title">Password Created!</h1>
          <p className="card-subtitle">Your security is our priority. You can now log in with your new password.</p>
          <div className="alert alert-success">Successfully registered! Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper glass-bg">
      <div className="card" style={{ maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>🔑</span>
          <h1 className="card-title">Create Password</h1>
          <p className="card-subtitle">Set a strong password to complete your registration</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Case sensitive"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Securing account...' : 'Set Password & Finish'}
          </button>
        </form>
      </div>
    </div>
  );
}
