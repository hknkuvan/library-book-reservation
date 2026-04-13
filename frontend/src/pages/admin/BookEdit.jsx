import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/books';

const CATEGORIES = [
  'Classic Literature', 'Dystopian Fiction', 'Romance', 'Coming-of-Age',
  'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Horror',
  'Non-Fiction', 'Technology', 'Biography', 'Self-Help', 'History',
  'Philosophy', 'Philosophical Fiction', 'Poetry', 'Drama', 'Children', 'Other'
];

export default function BookEdit() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', author: '', category: '', isbn: '',
    publication_date: '', pages: '', description: '',
    available_copies: '', total_copies: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const book = res.data.book;
        setFormData({
          title: book.title || '',
          author: book.author || '',
          category: book.category || '',
          isbn: book.isbn || '',
          publication_date: book.publication_date || '',
          pages: book.pages ? String(book.pages) : '',
          description: book.description || '',
          available_copies: String(book.available_copies || 0),
          total_copies: String(book.total_copies || 1)
        });
      } catch (err) {
        setServerError('Failed to load book data.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchBook();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
    setSuccessMsg('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.author.trim()) newErrors.author = 'Author is required.';
    if (formData.pages && (isNaN(formData.pages) || parseInt(formData.pages) < 1)) {
      newErrors.pages = 'Pages must be a positive number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.pages) payload.pages = parseInt(payload.pages);
      if (payload.available_copies !== '') payload.available_copies = parseInt(payload.available_copies);
      if (payload.total_copies !== '') payload.total_copies = parseInt(payload.total_copies);
      Object.keys(payload).forEach(key => { if (payload[key] === '') delete payload[key]; });

      await axios.put(`${API_URL}/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Book updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to update book.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <Header />
        <main className="page-content">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading book data...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-content" id="book-edit-page">
        <div className="card card-wide" style={{ maxWidth: '700px', margin: '0 auto', animation: 'cardSlideUp 0.5s ease-out' }}>
          <Link to={`/admin/books/${id}`} style={{ color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>
            ← Back to Book Details
          </Link>

          <h1 className="card-title">✏️ Edit Book</h1>
          <p className="card-subtitle">Update the book information below</p>

          {serverError && (
            <div className="alert alert-error" id="edit-book-error">
              <span className="alert-icon">⚠️</span>{serverError}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success" id="edit-book-success">
              <span className="alert-icon">✅</span>{successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} id="edit-book-form">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-title">Title *</label>
              <input type="text" id="edit-title" name="title" className={`form-input ${errors.title ? 'error' : ''}`}
                value={formData.title} onChange={handleChange} />
              {errors.title && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.title}</small>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-author">Author *</label>
              <input type="text" id="edit-author" name="author" className={`form-input ${errors.author ? 'error' : ''}`}
                value={formData.author} onChange={handleChange} />
              {errors.author && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.author}</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-category">Category</label>
                <select id="edit-category" name="category" className="form-input" value={formData.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-isbn">ISBN</label>
                <input type="text" id="edit-isbn" name="isbn" className="form-input" value={formData.isbn} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-pubdate">Publication Date</label>
                <input type="date" id="edit-pubdate" name="publication_date" className="form-input" value={formData.publication_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-pages">Pages</label>
                <input type="number" id="edit-pages" name="pages" className={`form-input ${errors.pages ? 'error' : ''}`}
                  value={formData.pages} onChange={handleChange} min="1" />
                {errors.pages && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.pages}</small>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-description">Description</label>
              <textarea id="edit-description" name="description" className="form-input"
                value={formData.description} onChange={handleChange} rows="4" style={{ resize: 'vertical' }} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-available">Available Copies</label>
                <input type="number" id="edit-available" name="available_copies" className="form-input"
                  value={formData.available_copies} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-total">Total Copies</label>
                <input type="number" id="edit-total" name="total_copies" className="form-input"
                  value={formData.total_copies} onChange={handleChange} min="1" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline btn-block" onClick={() => navigate(`/admin/books/${id}`)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading} id="btn-update-book">
                {loading && <span className="spinner"></span>}
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
