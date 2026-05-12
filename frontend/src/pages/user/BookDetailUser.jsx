import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function BookDetailUser() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [bookRes, reviewRes, favRes] = await Promise.all([
        axios.get(`${API}/books/${id}`, { headers }),
        axios.get(`${API}/user-books/reviews/${id}`, { headers }),
        axios.get(`${API}/favorites/ids`, { headers })
      ]);
      setBook(bookRes.data.book);
      setReviews(reviewRes.data.reviews || []);
      setIsFavorite((favRes.data.favoriteIds || []).includes(bookRes.data.book.id));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleBorrow = async () => {
    try {
      await axios.post(`${API}/reservations`, { book_id: book.id }, { headers });
      success(`"${book.title}" borrowed! Due in 14 days.`);
      setBook(prev => ({ ...prev, available_copies: prev.available_copies - 1 }));
    } catch (e) {
      error(e.response?.data?.message || 'Failed to borrow.');
    }
  };

  const handleAddLibrary = async (status) => {
    try {
      await axios.post(`${API}/user-books`, { book_id: book.id, status }, { headers });
      const labels = { want_to_read: 'Want to Read', reading: 'Currently Reading', read: 'Already Read' };
      success(`Added to "${labels[status]}" list!`);
    } catch (e) {
      error(e.response?.data?.message || 'Failed to add to library.');
    }
  };

  const handleToggleFavorite = async () => {
    setFavLoading(true);
    try {
      const res = await axios.post(`${API}/favorites/${book.id}`, {}, { headers });
      setIsFavorite(res.data.favorited);
      success(res.data.favorited ? 'Added to Favorites!' : 'Removed from Favorites.');
    } catch (e) {
      error('Failed to update favorite.');
    }
    setFavLoading(false);
  };

  const openReviewForm = (existing = null) => {
    if (existing) {
      setEditingReview(true);
      setReviewRating(existing.rating);
      setReviewText(existing.review);
    } else {
      setEditingReview(false);
      setReviewRating(0);
      setReviewText('');
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) { error('Please select a star rating.'); return; }
    if (!reviewText.trim()) { error('Please write a review before submitting.'); return; }
    setReviewLoading(true);
    try {
      await axios.post(`${API}/user-books/review`, { book_id: book.id, rating: reviewRating, review: reviewText }, { headers });
      success(editingReview ? 'Review updated!' : 'Review submitted successfully!');
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText('');
      const r = await axios.get(`${API}/user-books/reviews/${id}`, { headers });
      setReviews(r.data.reviews || []);
    } catch (e) {
      error(e.response?.data?.message || 'Failed to submit review.');
    }
    setReviewLoading(false);
  };

  const handleDeleteReview = async () => {
    try {
      await axios.delete(`${API}/user-books/review/${book.id}`, { headers });
      success('Review deleted.');
      const r = await axios.get(`${API}/user-books/reviews/${id}`, { headers });
      setReviews(r.data.reviews || []);
    } catch (e) {
      error(e.response?.data?.message || 'Failed to delete review.');
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const renderInteractiveStars = (current, onRate) => (
    <div className="star-rating" style={{ fontSize: '1.6rem', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onRate(s)}
          style={{ color: s <= current ? 'var(--accent-400)' : 'var(--text-muted)', marginRight: 2 }}>
          {s <= current ? '★' : '☆'}
        </span>
      ))}
    </div>
  );

  if (loading) return (
    <>
      <Header />
      <main className="page-content"><div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div></main>
    </>
  );

  if (!book) return (
    <>
      <Header />
      <main className="page-content"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Book not found.</p></main>
    </>
  );

  const isArchived = book.status === 'archived';
  const myReview = reviews.find(r => r.user_id === user?.id);

  return (
    <>
      <Header />
      <main className="page-content" id="book-detail-user-page">
        <div className="card card-wide" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link to="/books" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Browse
          </Link>

          {isArchived && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              <span className="alert-icon">📦</span>
              This book has been archived and is no longer available for borrowing.
            </div>
          )}

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div className="book-card-cover" style={{ width: 120, height: 170, fontSize: '2.5rem', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {book.cover_image ? (
                <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{book.title.charAt(0)}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', flex: 1 }}>{book.title}</h1>
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem',
                    color: isFavorite ? '#EF4444' : 'var(--text-muted)',
                    transition: 'color 150ms ease', flexShrink: 0, padding: '0 4px'
                  }}
                  id="btn-toggle-favorite"
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>by <strong>{book.author}</strong></p>
              {book.category && <span className="badge badge-category" style={{ marginBottom: '1rem', display: 'inline-block' }}>{book.category}</span>}
              {' '}
              {!isArchived && (
                <span className={`badge ${book.available_copies > 0 ? 'badge-available' : 'badge-unavailable'}`}>
                  {book.available_copies > 0 ? `${book.available_copies} Available` : 'Unavailable'}
                </span>
              )}
            </div>
          </div>

          <div className="detail-grid" style={{ marginTop: '1.5rem' }}>
            {book.isbn && <div className="detail-item"><span className="detail-label">ISBN</span><span className="detail-value">{book.isbn}</span></div>}
            {book.publication_date && <div className="detail-item"><span className="detail-label">Published</span><span className="detail-value">{book.publication_date}</span></div>}
            {book.pages && <div className="detail-item"><span className="detail-label">Pages</span><span className="detail-value">{book.pages}</span></div>}
            {!isArchived && <div className="detail-item"><span className="detail-label">Copies</span><span className="detail-value">{book.available_copies} / {book.total_copies}</span></div>}
          </div>

          {book.description && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📖 Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{book.description}</p>
            </div>
          )}

          {!isArchived && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link to={`/read/${book.id}`} className="btn btn-primary" style={{ background: 'var(--primary-600)', textDecoration: 'none' }}>
                📖 Read Now
              </Link>
              {book.available_copies > 0 && (
                <button className="btn btn-outline" onClick={handleBorrow} id="btn-borrow-book">📥 Borrow</button>
              )}
              <button className="btn btn-outline" onClick={() => handleAddLibrary('want_to_read')} id="btn-want-to-read">📋 Want to Read</button>
              <button className="btn btn-outline" onClick={() => handleAddLibrary('reading')}>📖 Reading</button>
              <button className="btn btn-outline" onClick={() => handleAddLibrary('read')}>✅ Already Read</button>
              {!myReview && (
                <button
                  className="btn btn-outline"
                  onClick={() => openReviewForm()}
                  style={{ borderColor: 'var(--accent-400)', color: 'var(--accent-400)' }}
                >
                  ⭐ Write a Review
                </button>
              )}
            </div>
          )}

          {/* Inline Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} style={{ marginTop: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                {editingReview ? '✏️ Edit Your Review' : '⭐ Write Your Review'}
              </h3>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Your Rating *</label>
                {renderInteractiveStars(reviewRating, setReviewRating)}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Your Review *</label>
                <textarea
                  className="form-input"
                  placeholder="Share your thoughts about this book..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  rows={4}
                  style={{ resize: 'vertical' }}
                  maxLength={1000}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={reviewLoading}>
                  {reviewLoading ? <span className="spinner"></span> : editingReview ? '💾 Update Review' : '💾 Submit Review'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Reviews Section */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>💬 Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r, i) => {
                  const isOwn = r.user_id === user?.id;
                  return (
                    <div key={i} className="review-card" style={isOwn ? { border: '1px solid var(--primary-400)', borderRadius: 'var(--radius-md)', padding: '0.75rem' } : {}}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong>{r.first_name} {r.last_name}</strong>
                          {isOwn && <span style={{ fontSize: '0.72rem', background: 'var(--primary-400)', color: '#fff', borderRadius: '999px', padding: '1px 7px' }}>You</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="star-display">{renderStars(r.rating)}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(r.updated_at).toLocaleDateString()}
                          </span>
                          {isOwn && (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                                onClick={() => openReviewForm(r)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.78rem', color: '#ef4444' }}
                                onClick={handleDeleteReview}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{r.review}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
