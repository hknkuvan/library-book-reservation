import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Profile() {
  const { user, token, updateProfile, deleteAccount } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [wantToRead, setWantToRead] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      axios.get(`${API}/user-books`, { headers, params: { status: 'want_to_read' } }),
      axios.get(`${API}/favorites`, { headers })
    ]).then(([wtrRes, favRes]) => {
      setWantToRead(wtrRes.data.books || []);
      setFavorites(favRes.data.favorites || []);
    }).catch(() => {}).finally(() => setListsLoading(false));
  }, [token]);

  const handleRemoveWantToRead = async (userBookId) => {
    try {
      await axios.delete(`${API}/user-books/${userBookId}`, { headers });
      setWantToRead(prev => prev.filter(b => b.id !== userBookId));
      toastSuccess('Removed from Want to Read list.');
    } catch (e) { toastError('Failed to remove.'); }
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      await axios.post(`${API}/favorites/${bookId}`, {}, { headers });
      setFavorites(prev => prev.filter(f => f.book_id !== bookId));
      toastSuccess('Removed from Favorites.');
    } catch (e) { toastError('Failed to remove.'); }
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
    setSuccessMsg('');
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
    if (formData.phone && !/^[+]?[\d\s()-]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please provide a valid phone number.';
    }
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    // Build update payload (only changed fields)
    const payload = {};
    if (formData.first_name !== user.first_name) payload.first_name = formData.first_name;
    if (formData.last_name !== user.last_name) payload.last_name = formData.last_name;
    if (formData.email !== user.email) payload.email = formData.email;
    if (formData.phone !== (user.phone || '')) payload.phone = formData.phone;
    if (formData.password) payload.password = formData.password;

    if (Object.keys(payload).length === 0) {
      setServerError('No changes to update.');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(payload);
      if (result.success) {
        setSuccessMsg('Profile updated successfully!');
        setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Update failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await deleteAccount();
      if (result.success) {
        navigate('/login');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Account deletion failed. Please try again.';
      setDeleteError(message);
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitials = () => {
    return `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <>
      <Header />
      <main className="page-content" id="profile-page">
        <div className="card card-wide" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">{getInitials()}</div>
            <div className="profile-info">
              <h2>{user?.first_name} {user?.last_name}</h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Edit Profile
          </h2>

          {serverError && (
            <div className="alert alert-error" id="profile-error">
              <span className="alert-icon">⚠️</span>
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" id="profile-success">
              <span className="alert-icon">✅</span>
              {successMsg}
            </div>
          )}

          {deleteError && (
            <div className="alert alert-error" id="delete-error">
              <span className="alert-icon">⚠️</span>
              {deleteError}
            </div>
          )}

          <form onSubmit={handleUpdate} id="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-first-name">First Name</label>
                <input
                  type="text"
                  id="profile-first-name"
                  name="first_name"
                  className={`form-input ${errors.first_name ? 'error' : ''}`}
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.first_name}</small>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-last-name">Last Name</label>
                <input
                  type="text"
                  id="profile-last-name"
                  name="last_name"
                  className={`form-input ${errors.last_name ? 'error' : ''}`}
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.last_name}</small>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address</label>
              <input
                type="email"
                id="profile-email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.email}</small>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">Phone Number</label>
              <input
                type="tel"
                id="profile-phone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="e.g. +90 555 123 4567"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.phone}</small>}
            </div>

            <div className="profile-divider"></div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Change Password
              <span style={{ fontSize: '0.8rem', fontWeight: 400, marginLeft: '0.5rem', opacity: 0.7 }}>(leave blank to keep current)</span>
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-password">New Password</label>
                <input
                  type="password"
                  id="profile-password"
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
                <label className="form-label" htmlFor="profile-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="profile-confirm-password"
                  name="confirm_password"
                  className={`form-input ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Repeat new password"
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
              id="btn-update-profile"
              style={{ marginTop: '0.5rem' }}
            >
              {loading && <span className="spinner"></span>}
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>

          {/* Danger Zone */}
          <div className="profile-danger-zone">
            <h4 className="profile-danger-title">⚠️ Danger Zone</h4>
            <p className="profile-danger-desc">
              Once you delete your account, there is no going back. This action is permanent and will remove all your data, including your reservation history and personal library.
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
              id="btn-delete-account"
            >
              🗑️ Delete My Account
            </button>
          </div>
        </div>
      </main>

      {/* Want to Read Section */}
      <div className="card card-wide" style={{ maxWidth: '600px', margin: '1.5rem auto 0' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 Want to Read <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({wantToRead.length})</span>
        </h2>
        {listsLoading ? (
          <div className="spinner" style={{ margin: '1rem auto', display: 'block' }}></div>
        ) : wantToRead.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No books yet. <Link to="/books" style={{ color: 'var(--primary-400)' }}>Browse books</Link> and click "Want to Read".
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {wantToRead.map(book => (
              <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                <div style={{ width: 40, height: 55, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {book.cover_image ? <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : book.title.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/books/${book.book_id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</Link>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>by {book.author}</span>
                </div>
                <button onClick={() => handleRemoveWantToRead(book.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorites Section */}
      <div className="card card-wide" style={{ maxWidth: '600px', margin: '1.5rem auto 0' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ❤️ Favorites <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({favorites.length})</span>
        </h2>
        {listsLoading ? (
          <div className="spinner" style={{ margin: '1rem auto', display: 'block' }}></div>
        ) : favorites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No favorites yet. Click the ❤️ on any book to save it here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {favorites.map(fav => (
              <div key={fav.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                <div style={{ width: 40, height: 55, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {fav.cover_image ? <img src={fav.cover_image} alt={fav.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fav.title.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/books/${fav.book_id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.title}</Link>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>by {fav.author}</span>
                </div>
                <button onClick={() => handleRemoveFavorite(fav.book_id)} title="Remove from Favorites" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '1.1rem' }}>❤️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed."
        icon="🗑️"
        iconClass="danger"
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
        confirmClass="btn-danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
      />
    </>
  );
}
