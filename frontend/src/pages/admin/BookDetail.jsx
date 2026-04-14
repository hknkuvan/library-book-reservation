import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/books';

export default function BookDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBook(res.data.book);
      } catch (err) {
        setError('Book not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, token]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/admin/books');
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-content">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading book details...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Header />
        <main className="page-content">
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '3rem' }}>📭</span>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{error || 'Book not found.'}</p>
            <Link to="/admin/books" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-block' }}>
              ← Back to Books
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-content" id="book-detail-page">
        <div className="card card-wide" style={{ maxWidth: '700px', margin: '0 auto', animation: 'cardSlideUp 0.5s ease-out' }}>
          {/* Back Link */}
          <Link to="/admin/books" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← Back to Book List
          </Link>

          {/* Book Title Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{book.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>by {book.author}</p>
          </div>

          {/* Details Grid */}
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">📂 Category</span>
              <span className="detail-value">{book.category || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📋 ISBN</span>
              <span className="detail-value" style={{ fontFamily: 'monospace' }}>{book.isbn || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📅 Publication Date</span>
              <span className="detail-value">{book.publication_date || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📄 Pages</span>
              <span className="detail-value">{book.pages || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📦 Available Copies</span>
              <span className={`detail-value ${book.available_copies > 0 ? 'text-success' : 'text-error'}`}>
                {book.available_copies} / {book.total_copies}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">📊 Status</span>
              <span className={`badge ${book.available_copies > 0 ? 'badge-available' : 'badge-unavailable'}`}>
                {book.available_copies > 0 ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📝 Description</h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{book.description}</p>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>Added: {new Date(book.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>Last Updated: {new Date(book.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to={`/read/${book.id}`} className="btn btn-block" style={{ background: 'var(--primary-600)', color: 'white', textDecoration: 'none', textAlign: 'center' }}>
              📖 Read Book
            </Link>
            <Link to={`/admin/books/${book.id}/edit`} className="btn btn-primary btn-block" id="btn-edit-book" style={{ textDecoration: 'none', textAlign: 'center' }}>
              ✏️ Edit Book
            </Link>
            <button className="btn btn-danger btn-block" onClick={() => setDeleteModal(true)} id="btn-delete-book">
              🗑️ Delete Book
            </button>
          </div>
        </div>
      </main>

      <Modal
        isOpen={deleteModal}
        title="Delete Book"
        message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
        icon="🗑️"
        iconClass="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmClass="btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        loading={deleteLoading}
      />
    </>
  );
}
