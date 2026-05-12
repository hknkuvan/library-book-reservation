import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function SubmitBook() {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ title: '', author: '', category: '', isbn: '', description: '', cover_image: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.author.trim()) e.author = 'Author is required.';
    if (form.isbn && !/^[\d\-xX]{9,17}$/.test(form.isbn.replace(/\s/g, ''))) {
      e.isbn = 'Please enter a valid ISBN (10 or 13 digits).';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/books/submit`, form, { headers });
      setSubmitted(true);
      success('Book submitted! It will appear in the catalog after admin approval.');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit book.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="page-content">
          <div className="card card-wide" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Submission Received!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your book has been submitted for admin review. Once approved, it will appear in the public catalog.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => { setSubmitted(false); setForm({ title: '', author: '', category: '', isbn: '', description: '', cover_image: '' }); }}>
                Submit Another Book
              </button>
              <Link to="/books" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Books</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-content" id="submit-book-page">
        <div className="card card-wide" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Link to="/books" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Browse
          </Link>

          <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>📬 Submit a Book</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Suggest a book for the library catalog. Your submission will be reviewed by an admin before being published.
            </p>
          </div>

          <form onSubmit={handleSubmit} id="submit-book-form">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" name="title" className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. The Hitchhiker's Guide to the Galaxy"
                value={form.title} onChange={handleChange} />
              {errors.title && <small style={{ color: 'var(--error-400)' }}>{errors.title}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Author *</label>
              <input type="text" name="author" className={`form-input ${errors.author ? 'error' : ''}`}
                placeholder="e.g. Douglas Adams"
                value={form.author} onChange={handleChange} />
              {errors.author && <small style={{ color: 'var(--error-400)' }}>{errors.author}</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" name="category" className="form-input"
                  placeholder="e.g. Science Fiction"
                  value={form.category} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input type="text" name="isbn" className={`form-input ${errors.isbn ? 'error' : ''}`}
                  placeholder="e.g. 978-0345391803"
                  value={form.isbn} onChange={handleChange} />
                {errors.isbn && <small style={{ color: 'var(--error-400)' }}>{errors.isbn}</small>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-input" rows={4}
                placeholder="Brief description of the book..."
                value={form.description} onChange={handleChange}
                style={{ resize: 'vertical' }} maxLength={2000} />
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image URL</label>
              <input type="url" name="cover_image" className="form-input"
                placeholder="https://example.com/cover.jpg"
                value={form.cover_image} onChange={handleChange} />
              {form.cover_image && (
                <img src={form.cover_image} alt="Cover preview" onError={e => { e.target.style.display = 'none'; }}
                  style={{ marginTop: '0.5rem', width: 60, height: 85, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner"></span> Submitting...</> : '📬 Submit for Review'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
