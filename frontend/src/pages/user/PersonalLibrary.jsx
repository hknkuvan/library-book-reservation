import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function PersonalLibrary() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchBooks = async () => {
    try {
      const params = tab !== 'all' ? { status: tab } : {};
      const res = await axios.get(`${API}/user-books`, { headers, params });
      setBooks(res.data.books || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, [tab]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/user-books/${id}`, { status: newStatus }, { headers });
      success('Status updated!');
      fetchBooks();
    } catch (e) { error(e.response?.data?.message || 'Failed to update.'); }
  };

  const handleReview = async (id, rating, review) => {
    try {
      await axios.put(`${API}/user-books/${id}`, { rating, review }, { headers });
      success('Review saved perfectly!');
      fetchBooks();
    } catch (e) { error(e.response?.data?.message || 'Failed to save review.'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this book from your library?')) return;
    try {
      await axios.delete(`${API}/user-books/${id}`, { headers });
      success('Book removed from library.');
      fetchBooks();
    } catch (e) { error(e.response?.data?.message || 'Failed to remove.'); }
  };

  const tabs = [
    { key: 'all', label: '📚 All', count: books.length },
    { key: 'want_to_read', label: '📋 Want to Read' },
    { key: 'reading', label: '📖 Reading' },
    { key: 'read', label: '✅ Read' },
  ];

  const renderStars = (rating, onRate) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={`star ${s <= rating ? 'active' : ''}`}
            onClick={() => onRate && onRate(s)} style={{ cursor: onRate ? 'pointer' : 'default' }}>
            {s <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="page-content" id="personal-library-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📖</span>
          <h1 className="welcome-title">Personal Library</h1>
          <p className="welcome-subtitle">Track your reading journey</p>
        </div>

        {/* Removing old msg bar in favor of global toast component */}

        <div className="card card-wide" style={{ animation: 'cardSlideUp 0.5s ease-out' }}>
          <div className="tab-bar">
            {tabs.map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => { setTab(t.key); setLoading(true); }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                {tab === 'all' ? 'Your library is empty.' : `No books in "${tab.replace(/_/g, ' ')}" list.`}
              </p>
              <Link to="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Books</Link>
            </div>
          ) : (
            <div className="library-list">
              {books.map(book => (
                <LibraryBookCard
                  key={book.id} book={book}
                  onStatusChange={handleStatusChange}
                  onReview={handleReview}
                  onRemove={handleRemove}
                  renderStars={renderStars}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function LibraryBookCard({ book, onStatusChange, onReview, onRemove, renderStars }) {
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(book.rating || 0);
  const [review, setReview] = useState(book.review || '');

  const statusLabels = { want_to_read: '📋 Want to Read', reading: '📖 Reading', read: '✅ Read' };

  return (
    <div className="library-card">
      <div className="library-card-left">
        <Link to={`/read/${book.book_id}`} className="book-card-cover small" style={{ display: 'block', textDecoration: 'none' }}>
          {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
          ) : (
              <span>{book.title.charAt(0)}</span>
          )}
        </Link>
      </div>
      <div className="library-card-body">
        <Link to={`/books/${book.book_id}`} className="library-card-title">{book.title}</Link>
        <p className="library-card-author">by {book.author}</p>
        {book.category && <span className="badge badge-category">{book.category}</span>}

        <div className="library-card-controls">
          <select className="form-input" value={book.status}
            onChange={(e) => onStatusChange(book.id, e.target.value)}
            style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.85rem' }}>
            <option value="want_to_read">📋 Want to Read</option>
            <option value="reading">📖 Reading</option>
            <option value="read">✅ Read</option>
          </select>

          {book.status === 'read' && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowReview(!showReview)}>
              {book.rating ? '✏️ Edit Review' : '⭐ Add Review'}
            </button>
          )}
          <Link to={`/read/${book.book_id}`} className="btn btn-sm" style={{ background: 'var(--primary-600)', color: 'white', textDecoration: 'none' }}>📖 Read</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => onRemove(book.id)} title="Remove">🗑️</button>
        </div>

        {book.rating && !showReview && (
          <div className="library-card-rating">
            {renderStars(book.rating)} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{book.rating}/5</span>
          </div>
        )}

        {showReview && (
          <div className="review-form">
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Rating:</label>
              {renderStars(rating, setRating)}
            </div>
            <textarea className="form-input" placeholder="Write your review..." value={review}
              onChange={(e) => setReview(e.target.value)} rows="3" style={{ resize: 'vertical', fontSize: '0.9rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { onReview(book.id, rating, review); setShowReview(false); }}
                disabled={rating === 0}>💾 Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReview(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
