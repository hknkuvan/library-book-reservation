import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function BrowseBooks() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchBooks = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await axios.get(`${API}/books`, { headers, params });
      setBooks(res.data.books || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    axios.get(`${API}/books/categories`, { headers }).then(r => setCategories(r.data.categories || [])).catch(() => {});
    axios.get(`${API}/favorites/ids`, { headers }).then(r => setFavoriteIds(new Set(r.data.favoriteIds || []))).catch(() => {});
  }, []);

  useEffect(() => { fetchBooks(); }, [search, category]);

  const handleBorrow = async (bookId) => {
    try {
      await axios.post(`${API}/reservations`, { book_id: bookId }, { headers });
      success(`Book borrowed! Due in 14 days.`);
      fetchBooks();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to borrow.');
    }
  };

  const handleAddToLibrary = async (bookId) => {
    try {
      await axios.post(`${API}/user-books`, { book_id: bookId, status: 'want_to_read' }, { headers });
      success('Added to your Want to Read list!');
    } catch (e) {
      error(e.response?.data?.message || 'Failed to add.');
    }
  };

  const handleToggleFavorite = async (bookId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(`${API}/favorites/${bookId}`, {}, { headers });
      setFavoriteIds(prev => {
        const next = new Set(prev);
        res.data.favorited ? next.add(bookId) : next.delete(bookId);
        return next;
      });
      success(res.data.favorited ? 'Added to Favorites!' : 'Removed from Favorites.');
    } catch (e) {
      error('Failed to update favorite.');
    }
  };

  return (
    <>
      <Header />
      <main className="page-content" id="browse-books-page">
        <div className="welcome-section">
          <span className="welcome-emoji">🔍</span>
          <h1 className="welcome-title">Browse Books</h1>
          <p className="welcome-subtitle">Discover and borrow from our collection</p>
        </div>

        <div className="card card-wide">
          {/* Search bar */}
          <div className="filter-bar" style={{ marginBottom: categories.length > 0 ? '0.75rem' : undefined }}>
            <input
              type="text" className="form-input" placeholder="Search by title, author, or ISBN..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }} id="browse-search"
            />
          </div>

          {/* Category / Genre filter pills */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setCategory('')}
                style={{
                  padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: category === '' ? 'var(--primary-500)' : 'var(--bg-elevated)',
                  color: category === '' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: category === '' ? 600 : 400,
                  transition: 'all 150ms ease'
                }}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? '' : c)}
                  style={{
                    padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', cursor: 'pointer',
                    border: `1px solid ${category === c ? 'var(--primary-400)' : 'var(--border-color)'}`,
                    background: category === c ? 'var(--primary-500)' : 'var(--bg-elevated)',
                    color: category === c ? '#fff' : 'var(--text-secondary)',
                    fontWeight: category === c ? 600 : 400,
                    transition: 'all 150ms ease'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Active filter indicator */}
          {(category || search) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>{books.length} result{books.length !== 1 ? 's' : ''}</span>
              {category && <span style={{ background: 'var(--bg-elevated)', borderRadius: '999px', padding: '2px 10px', border: '1px solid var(--border-color)' }}>Category: {category}</span>}
              {search && <span style={{ background: 'var(--bg-elevated)', borderRadius: '999px', padding: '2px 10px', border: '1px solid var(--border-color)' }}>"{search}"</span>}
              <button onClick={() => { setSearch(''); setCategory(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-400)', cursor: 'pointer', fontSize: '0.82rem' }}>
                Clear filters
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : books.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No books found.</p>
          ) : (
            <div className="book-grid">
              {books.map(book => (
                <div className="book-card" key={book.id} id={`book-card-${book.id}`} style={{ position: 'relative' }}>
                  {/* Favorite heart button */}
                  <button
                    onClick={(e) => handleToggleFavorite(book.id, e)}
                    title={favoriteIds.has(book.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 2,
                      background: 'rgba(15,15,26,0.7)', border: 'none', borderRadius: '50%',
                      width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 150ms ease'
                    }}
                  >
                    {favoriteIds.has(book.id) ? '❤️' : '🤍'}
                  </button>

                  <Link to={`/books/${book.id}`} className="book-card-cover" style={{ display: 'block', textDecoration: 'none' }}>
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{book.title.charAt(0)}</span>
                    )}
                  </Link>
                  <div className="book-card-body">
                    <Link to={`/books/${book.id}`} className="book-card-title">{book.title}</Link>
                    <p className="book-card-author">by {book.author}</p>
                    {book.category && (
                      <button
                        onClick={() => setCategory(book.category)}
                        className="badge badge-category"
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                        title={`Filter by ${book.category}`}
                      >
                        {book.category}
                      </button>
                    )}
                    <div className="book-card-meta">
                      {book.pages && <span>📄 {book.pages} pages</span>}
                      <span className={book.available_copies > 0 ? 'text-success' : 'text-error'}>
                        {book.available_copies > 0 ? `✅ ${book.available_copies} available` : '❌ Unavailable'}
                      </span>
                    </div>
                    <div className="book-card-actions" style={{ flexWrap: 'wrap' }}>
                      <Link to={`/read/${book.id}`} className="btn btn-sm" style={{ background: 'var(--primary-600)', color: 'white', border: 'none', textDecoration: 'none' }}>
                        📖 Read
                      </Link>
                      {book.available_copies > 0 && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleBorrow(book.id)}>
                          📥 Borrow
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => handleAddToLibrary(book.id)}>
                        📋 Want to Read
                      </button>
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
