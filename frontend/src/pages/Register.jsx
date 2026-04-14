import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    birth_date: '',
    birth_place_country: '',
    birth_place_city: '',
    gender: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const mandatory = ['first_name', 'last_name', 'email', 'birth_date', 'birth_place_country', 'birth_place_city', 'gender'];
    
    mandatory.forEach(field => {
      if (!formData[field] || !formData[field].toString().trim()) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required.`;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        setSuccessData({
          email: formData.email,
          setupUrl: result.setupUrl || `/create-password/${result.token}`
        });
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="page-wrapper glass-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', animation: 'cardFadeIn 0.8s ease' }}>
          <div className="success-icon" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
          <h1 className="card-title">Check Your Email!</h1>
          <p className="card-subtitle" style={{ marginBottom: '2rem' }}>
            A link to create your password has been sent to <strong>{successData.email}</strong>.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', background: 'rgba(30, 64, 175, 0.1)', border: '1px solid var(--primary-500)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              <strong>Demo Mode:</strong> Since we can't send real emails in this environment, please click the link below to set your password:
            </p>
            <Link to={successData.setupUrl} className="btn btn-primary btn-block" style={{ marginTop: '1rem', textDecoration: 'none' }}>
              Create My Password →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper glass-bg">
      <div className="card card-wide" style={{ maxWidth: '900px', animation: 'cardSlideUp 0.6s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src="/logo-placeholder.svg" alt="Library" style={{ height: '50px', filter: 'invert(1)' }} />
          <h1 className="card-title" style={{ marginTop: '1rem' }}>Join the Library</h1>
          <p className="card-subtitle">Create an account to discover and read premium books</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="premium-form">
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input name="first_name" className={`form-input ${errors.first_name ? 'error' : ''}`} value={formData.first_name} onChange={handleChange} placeholder="John" />
                {errors.first_name && <small className="field-error">{errors.first_name}</small>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input name="last_name" className={`form-input ${errors.last_name ? 'error' : ''}`} value={formData.last_name} onChange={handleChange} placeholder="Doe" />
                {errors.last_name && <small className="field-error">{errors.last_name}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Birth Date *</label>
                <input type="date" name="birth_date" className={`form-input ${errors.birth_date ? 'error' : ''}`} value={formData.birth_date} onChange={handleChange} />
                {errors.birth_date && <small className="field-error">{errors.birth_date}</small>}
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select name="gender" className={`form-input ${errors.gender ? 'error' : ''}`} value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <small className="field-error">{errors.gender}</small>}
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '2rem' }}>
            <h3 className="section-title">Birth Place</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Country *</label>
                <input name="birth_place_country" className={`form-input ${errors.birth_place_country ? 'error' : ''}`} value={formData.birth_place_country} onChange={handleChange} placeholder="Turkey" />
                {errors.birth_place_country && <small className="field-error">{errors.birth_place_country}</small>}
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input name="birth_place_city" className={`form-input ${errors.birth_place_city ? 'error' : ''}`} value={formData.birth_place_city} onChange={handleChange} placeholder="Istanbul" />
                {errors.birth_place_city && <small className="field-error">{errors.birth_place_city}</small>}
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '2rem' }}>
            <h3 className="section-title">Contact & Security</h3>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" name="email" className={`form-input ${errors.email ? 'error' : ''}`} value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+90 5xx xxx xx xx" />
              </div>
              <div className="form-group">
                <label className="form-label">Address (Optional)</label>
                <input name="address" className="form-input" value={formData.address} onChange={handleChange} placeholder="Building, Street, Area..." />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Continue to Password Creation →'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
