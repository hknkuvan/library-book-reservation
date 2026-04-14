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
  }, []);

  useEffect(() => { fetchBooks(); }, [search, category]);

  const handleBorrow = async (bookId) => {
    try {
      await axios.post(`${API}/reservations`, { book_id: bookId }, { headers });
      success('Successfully borrowed book!');
      fetchBooks();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to borrow.');
    }
  };

  const handleAddToLibrary = async (bookId) => {
    try {
      await axios.post(`${API}/user-books`, { book_id: bookId, status: 'want_to_read' }, { headers });
      success('Added to your library!');
    } catch (e) {
      error(e.response?.data?.message || 'Failed to add.');
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

        <div className="card card-wide" style={{ animation: 'cardSlideUp 0.5s ease-out' }}>
          <div className="filter-bar">
            <input
              type="text" className="form-input" placeholder="Search by title, author, or ISBN..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2 }} id="browse-search"
            />
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ flex: 1 }} id="browse-category-filter">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : books.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No books found.</p>
          ) : (
            <div className="book-grid">
              {books.map(book => (
                <div className="book-card" key={book.id} id={`book-card-${book.id}`}>
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
                    {book.category && <span className="badge badge-category">{book.category}</span>}
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
                        ➕ My Library
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
