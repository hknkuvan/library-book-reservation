import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function BookCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', author: '', category: '', isbn: '',
    publication_date: '', pages: '', description: '',
    available_copies: '1', total_copies: '1'
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.author.trim()) newErrors.author = 'Author is required.';
    if (formData.pages && (isNaN(formData.pages) || parseInt(formData.pages) < 1)) {
      newErrors.pages = 'Pages must be a positive number.';
    }
    if (formData.available_copies && parseInt(formData.available_copies) < 0) {
      newErrors.available_copies = 'Available copies cannot be negative.';
    }
    if (formData.total_copies && parseInt(formData.total_copies) < 1) {
      newErrors.total_copies = 'Total copies must be at least 1.';
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
      const payload = { ...formData };
      if (payload.pages) payload.pages = parseInt(payload.pages);
      if (payload.available_copies) payload.available_copies = parseInt(payload.available_copies);
      if (payload.total_copies) payload.total_copies = parseInt(payload.total_copies);
      // Remove empty strings
      Object.keys(payload).forEach(key => { if (payload[key] === '') delete payload[key]; });

      await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/admin/books');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to create book.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page-content" id="book-create-page">
        <div className="card card-wide" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📖</span>
          </div>
          <h1 className="card-title" style={{ textAlign: 'center' }}>Add New Book</h1>
          <p className="card-subtitle" style={{ textAlign: 'center' }}>
            Fill in the book details to add it to the library catalog
          </p>

          {serverError && (
            <div className="alert alert-error" id="create-book-error">
              <span className="alert-icon">⚠️</span>{serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} id="create-book-form">
            <div className="form-group">
              <label className="form-label" htmlFor="book-title">Title *</label>
              <input type="text" id="book-title" name="title" className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter book title" value={formData.title} onChange={handleChange} autoFocus />
              {errors.title && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.title}</small>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-author">Author *</label>
              <input type="text" id="book-author" name="author" className={`form-input ${errors.author ? 'error' : ''}`}
                placeholder="Enter author name" value={formData.author} onChange={handleChange} />
              {errors.author && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.author}</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="book-category">Category</label>
                <select id="book-category" name="category" className="form-input" value={formData.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="book-isbn">ISBN</label>
                <input type="text" id="book-isbn" name="isbn" className="form-input"
                  placeholder="e.g. 978-0743273565" value={formData.isbn} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="book-pubdate">Publication Date</label>
                <input type="date" id="book-pubdate" name="publication_date" className="form-input"
                  value={formData.publication_date} onChange={handleChange} max="2099-12-31" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="book-pages">Pages</label>
                <input type="number" id="book-pages" name="pages" className={`form-input ${errors.pages ? 'error' : ''}`}
                  placeholder="e.g. 320" value={formData.pages} onChange={handleChange} min="1" />
                {errors.pages && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.pages}</small>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-description">Description</label>
              <textarea id="book-description" name="description" className="form-input"
                placeholder="Enter book description..." value={formData.description} onChange={handleChange}
                rows="4" style={{ resize: 'vertical' }} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="book-available">Available Copies</label>
                <input type="number" id="book-available" name="available_copies"
                  className={`form-input ${errors.available_copies ? 'error' : ''}`}
                  value={formData.available_copies} onChange={handleChange} min="0" />
                {errors.available_copies && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.available_copies}</small>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="book-total">Total Copies</label>
                <input type="number" id="book-total" name="total_copies"
                  className={`form-input ${errors.total_copies ? 'error' : ''}`}
                  value={formData.total_copies} onChange={handleChange} min="1" />
                {errors.total_copies && <small style={{ color: 'var(--error-400)', fontSize: '0.8rem' }}>{errors.total_copies}</small>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline btn-block" onClick={() => navigate('/admin/books')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading} id="btn-save-book">
                {loading && <span className="spinner"></span>}
                {loading ? 'Saving...' : '💾 Save Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
