import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required.';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
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
      const result = await register(formData);
      if (result.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
            <h1 className="card-title" style={{ textAlign: 'center' }}>Account Created!</h1>
            <p className="card-subtitle" style={{ textAlign: 'center' }}>
              Your account has been created successfully. Redirecting to login page...
            </p>
            <div className="alert alert-success" style={{ justifyContent: 'center' }}>
              <span className="alert-icon">✅</span>
              Registration successful!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="card card-wide">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>📝</span>
        </div>
        <h1 className="card-title" style={{ textAlign: 'center' }}>Create Account</h1>
        <p className="card-subtitle" style={{ textAlign: 'center' }}>
          Join our library to start reserving books
        </p>

        {serverError && (
          <div className="alert alert-error" id="register-error">
            <span className="alert-icon">⚠️</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} id="register-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="register-first-name">First Name *</label>
              <input
                type="text"
                id="register-first-name"
                name="first_name"
                className={`form-input ${errors.first_name ? 'error' : ''}`}
                placeholder="John"
                value={formData.first_name}
                onChange={handleChange}
                autoFocus
              />
              {errors.first_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.first_name}</small>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-last-name">Last Name *</label>
              <input
                type="text"
                id="register-last-name"
                name="last_name"
                className={`form-input ${errors.last_name ? 'error' : ''}`}
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.last_name}</small>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address *</label>
            <input
              type="email"
              id="register-email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.email}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password *</label>
              <input
                type="password"
                id="register-password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.password}</small>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">Confirm Password *</label>
              <input
                type="password"
                id="register-confirm-password"
                name="confirm_password"
                className={`form-input ${errors.confirm_password ? 'error' : ''}`}
                placeholder="Repeat your password"
                value={formData.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirm_password && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.confirm_password}</small>}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="btn-register"
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="form-footer">
          Already have an account?{' '}
          <Link to="/login" id="link-login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
