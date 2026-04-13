import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'New password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Password confirmation is required.';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reset-password`, {
        token,
        password: formData.password,
        confirm_password: formData.confirm_password
      });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Password reset failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
            <h1 className="card-title" style={{ textAlign: 'center' }}>Invalid Reset Link</h1>
            <p className="card-subtitle" style={{ textAlign: 'center' }}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="form-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/forgot-password">Request New Reset Link</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
            <h1 className="card-title" style={{ textAlign: 'center' }}>Password Reset!</h1>
            <p className="card-subtitle" style={{ textAlign: 'center' }}>
              Your password has been reset successfully. Redirecting to login...
            </p>
            <div className="alert alert-success" style={{ justifyContent: 'center' }}>
              <span className="alert-icon">✅</span>
              You can now login with your new password.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔐</span>
        </div>
        <h1 className="card-title" style={{ textAlign: 'center' }}>Reset Password</h1>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>
          Enter your new password below.
        </p>

        {serverError && (
          <div className="alert alert-error" id="reset-error">
            <span className="alert-icon">⚠️</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} id="reset-password-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">New Password</label>
            <input
              type="password"
              id="reset-password"
              name="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              autoFocus
            />
            {errors.password && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.password}</small>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="reset-confirm-password"
              name="confirm_password"
              className={`form-input ${errors.confirm_password ? 'error' : ''}`}
              placeholder="Repeat your new password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirm_password && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.confirm_password}</small>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="btn-reset-submit"
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login" id="link-back-login-3">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
