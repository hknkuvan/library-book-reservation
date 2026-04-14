import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function BookDetailUser() {
  const { id } = useParams();
  const { token } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, reviewRes] = await Promise.all([
          axios.get(`${API}/books/${id}`, { headers }),
          axios.get(`${API}/user-books/reviews/${id}`, { headers })
        ]);
        setBook(bookRes.data.book);
        setReviews(reviewRes.data.reviews || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleBorrow = async () => {
    try {
      await axios.post(`${API}/reservations`, { book_id: book.id }, { headers });
      success('Book borrowed! Due in 14 days.');
      setBook(prev => ({ ...prev, available_copies: prev.available_copies - 1 }));
    } catch (e) {
      error(e.response?.data?.message || 'Failed to borrow.');
    }
  };

  const handleAddLibrary = async (status) => {
    try {
      await axios.post(`${API}/user-books`, { book_id: book.id, status }, { headers });
      success('Added to your library!');
    } catch (e) {
      error(e.response?.data?.message || 'Failed to add.');
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

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

  return (
    <>
      <Header />
      <main className="page-content" id="book-detail-user-page">
        <div className="card card-wide" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link to="/books" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Browse
          </Link>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div className="book-card-cover" style={{ width: 120, height: 170, fontSize: '2.5rem', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                  <span>{book.title.charAt(0)}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{book.title}</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>by <strong>{book.author}</strong></p>
              {book.category && <span className="badge badge-category" style={{ marginBottom: '1rem', display: 'inline-block' }}>{book.category}</span>}
              <span className={`badge ${book.available_copies > 0 ? 'badge-available' : 'badge-unavailable'}`} style={{ marginLeft: '0.5rem' }}>
                {book.available_copies > 0 ? `${book.available_copies} Available` : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Removing local msg alert to use global toast */}

          <div className="detail-grid" style={{ marginTop: '1.5rem' }}>
            {book.isbn && <div className="detail-item"><span className="detail-label">ISBN</span><span className="detail-value">{book.isbn}</span></div>}
            {book.publication_date && <div className="detail-item"><span className="detail-label">Published</span><span className="detail-value">{book.publication_date}</span></div>}
            {book.pages && <div className="detail-item"><span className="detail-label">Pages</span><span className="detail-value">{book.pages}</span></div>}
            <div className="detail-item"><span className="detail-label">Copies</span><span className="detail-value">{book.available_copies} / {book.total_copies}</span></div>
          </div>

          {book.description && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📖 Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{book.description}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to={`/read/${book.id}`} className="btn btn-primary" style={{ background: 'var(--primary-600)' }}>
              📖 Read Now
            </Link>
            {book.available_copies > 0 && (
              <button className="btn btn-outline" onClick={handleBorrow} id="btn-borrow-book">📥 Borrow This Book</button>
            )}
            <button className="btn btn-outline" onClick={() => handleAddLibrary('want_to_read')}>📚 Want to Read</button>
            <button className="btn btn-outline" onClick={() => handleAddLibrary('reading')}>📖 Currently Reading</button>
            <button className="btn btn-outline" onClick={() => handleAddLibrary('read')}>✅ Already Read</button>
          </div>


          {/* Reviews Section */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>💬 Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r, i) => (
                  <div key={i} className="review-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{r.first_name} {r.last_name}</strong>
                      <span className="star-display">{renderStars(r.rating)}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{r.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
