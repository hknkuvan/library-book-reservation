import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function NewArrivals() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${API}/books`, { headers, params: { limit: 50 } });
        // Sort by created_at desc (already sorted from backend), take recent
        const allBooks = res.data.books || [];
        setBooks(allBooks.slice(0, 20));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const handleBorrow = async (bookId) => {
    try {
      await axios.post(`${API}/reservations`, { book_id: bookId }, { headers });
      // Refresh
      const res = await axios.get(`${API}/books`, { headers, params: { limit: 50 } });
      setBooks((res.data.books || []).slice(0, 20));
      success('Successfully borrowed book!');
    } catch (e) {
      error(e.response?.data?.message || 'Failed to borrow.');
    }
  };

  const handleAddLibrary = async (bookId) => {
    try {
      await axios.post(`${API}/user-books`, { book_id: bookId, status: 'want_to_read' }, { headers });
      success('Added to your library!');
    } catch (e) {
      error(e.response?.data?.message || 'Failed to add.');
    }
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <>
      <Header />
      <main className="page-content" id="new-arrivals-page">
        <div className="welcome-section">
          <span className="welcome-emoji">✨</span>
          <h1 className="welcome-title">New Arrivals</h1>
          <p className="welcome-subtitle">Discover the latest additions to our library</p>
        </div>

        <div className="card card-wide" style={{ }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : books.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No books in the catalog yet.</p>
          ) : (
            <div className="book-grid">
              {books.map(book => (
                <div className="book-card" key={book.id}>
                  <Link to={`/books/${book.id}`} className="book-card-cover" style={{ display: 'block', textDecoration: 'none' }}>
                    {book.cover_image ? (
                        <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span>{book.title.charAt(0)}</span>
                    )}
                    <div className="new-badge">NEW</div>
                  </Link>
                  <div className="book-card-body">
                    <Link to={`/books/${book.id}`} className="book-card-title">{book.title}</Link>
                    <p className="book-card-author">by {book.author}</p>
                    {book.category && <span className="badge badge-category">{book.category}</span>}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      Added {getTimeAgo(book.created_at)}
                    </p>
                    <div className="book-card-actions" style={{ flexWrap: 'wrap' }}>
                      <Link to={`/read/${book.id}`} className="btn btn-sm" style={{ background: 'var(--primary-600)', color: 'white', border: 'none', textDecoration: 'none' }}>
                        📖 Read
                      </Link>
                      {book.available_copies > 0 && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleBorrow(book.id)}>📥 Borrow</button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => handleAddLibrary(book.id)}>➕ My Library</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
