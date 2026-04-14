import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender...' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_country: '',
    birth_city: '',
    gender: '',
    address: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setPasswordUrl, setSetPasswordUrl] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required.';

    if (!formData.birth_date) {
      newErrors.birth_date = 'Birth date is required.';
    } else {
      const bd = new Date(formData.birth_date);
      if (isNaN(bd.getTime())) newErrors.birth_date = 'Please enter a valid birth date.';
      else if (bd > new Date()) newErrors.birth_date = 'Birth date cannot be in the future.';
    }

    if (!formData.birth_country.trim()) newErrors.birth_country = 'Birth country is required.';
    if (!formData.birth_city.trim()) newErrors.birth_city = 'Birth city is required.';
    if (!formData.gender) newErrors.gender = 'Gender is required.';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (formData.phone && !/^[+]?[\d\s()-]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please provide a valid phone number.';
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
      const res = await axios.post(`${API_URL}/register`, formData);
      if (res.data.success) {
        setSetPasswordUrl(res.data.setPasswordUrl || '');
      }
    } catch (err) {
      const data = err.response?.data;
      const message = data?.errors?.[0] || data?.message || 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  // Success screen — show set-password link
  if (setPasswordUrl !== '' || (setPasswordUrl === '' && loading === false && serverError === '' && formData.email === '')) {
    // Only show success if we actually got a URL back (or email was cleared after success)
  }

  if (setPasswordUrl) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📧</span>
            <h1 className="card-title" style={{ textAlign: 'center' }}>Check Your Email</h1>
            <p className="card-subtitle" style={{ textAlign: 'center' }}>
              Your account has been created. We've sent a link to <strong>{formData.email}</strong> to set your password.
            </p>

            <div className="alert alert-success" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <span className="alert-icon">✅</span>
              Registration successful!
            </div>

            <div style={{
              marginTop: '1.25rem', padding: '1rem',
              background: 'rgba(99,102,241,0.08)', borderRadius: '12px',
              fontSize: '0.85rem', wordBreak: 'break-all', textAlign: 'left'
            }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Demo Mode — Set Password Link:
              </p>
              <a href={setPasswordUrl} style={{ color: 'var(--primary-400)' }}>{setPasswordUrl}</a>
            </div>

            <div className="form-footer" style={{ marginTop: '1.5rem' }}>
              Already set your password? <Link to="/login" id="link-login-after-register">Sign in</Link>
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

        <form onSubmit={handleSubmit} id="register-form" noValidate>

          {/* Name row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-first-name">First Name *</label>
              <input
                type="text" id="reg-first-name" name="first_name"
                className={`form-input ${errors.first_name ? 'error' : ''}`}
                placeholder="John" value={formData.first_name}
                onChange={handleChange} autoFocus
              />
              {errors.first_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.first_name}</small>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-last-name">Last Name *</label>
              <input
                type="text" id="reg-last-name" name="last_name"
                className={`form-input ${errors.last_name ? 'error' : ''}`}
                placeholder="Doe" value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.last_name}</small>}
            </div>
          </div>

          {/* Birth date + Gender row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-birth-date">Birth Date *</label>
              <input
                type="date" id="reg-birth-date" name="birth_date"
                className={`form-input ${errors.birth_date ? 'error' : ''}`}
                value={formData.birth_date} onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.birth_date && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.birth_date}</small>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-gender">Gender *</label>
              <select
                id="reg-gender" name="gender"
                className={`form-input ${errors.gender ? 'error' : ''}`}
                value={formData.gender} onChange={handleChange}
              >
                {GENDER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} disabled={o.value === ''}>{o.label}</option>
                ))}
              </select>
              {errors.gender && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.gender}</small>}
            </div>
          </div>

          {/* Country + City row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-birth-country">Birth Country *</label>
              <input
                type="text" id="reg-birth-country" name="birth_country"
                className={`form-input ${errors.birth_country ? 'error' : ''}`}
                placeholder="e.g. Turkey" value={formData.birth_country}
                onChange={handleChange}
              />
              {errors.birth_country && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.birth_country}</small>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-birth-city">Birth City *</label>
              <input
                type="text" id="reg-birth-city" name="birth_city"
                className={`form-input ${errors.birth_city ? 'error' : ''}`}
                placeholder="e.g. Istanbul" value={formData.birth_city}
                onChange={handleChange}
              />
              {errors.birth_city && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.birth_city}</small>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address *</label>
            <input
              type="email" id="reg-email" name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="john.doe@example.com" value={formData.email}
              onChange={handleChange} autoComplete="email"
            />
            {errors.email && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.email}</small>}
          </div>

          {/* Phone + Address row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                type="tel" id="reg-phone" name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="+90 555 000 0000" value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.phone}</small>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-address">Address <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                type="text" id="reg-address" name="address"
                className="form-input"
                placeholder="Street, City, Country..." value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="btn-register"
            style={{ marginTop: '0.5rem' }}
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Creating Account...' : 'Register'}
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
