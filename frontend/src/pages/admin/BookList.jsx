import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/books';

export default function BookList() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, book: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/', { params });
      setBooks(res.data.books || []);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchBooks(), 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleDelete = async () => {
    if (!deleteModal.book) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/${deleteModal.book.id}`);
      setBooks(prev => prev.filter(b => b.id !== deleteModal.book.id));
      setDeleteModal({ open: false, book: null });
      setSuccessMsg('Book deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page-content" id="book-list-page">
        <div style={{ width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>📚 Book Management</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{books.length} books in catalog</p>
            </div>
            <Link to="/admin/books/create" className="btn btn-primary" id="btn-add-book" style={{ textDecoration: 'none' }}>
              ➕ Add New Book
            </Link>
          </div>

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <span className="alert-icon">✅</span>{successMsg}
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '200px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="🔍 Search by title, author, or ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="search-books"
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  id="filter-category"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Books Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <span style={{ fontSize: '3rem' }}>📖</span>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No books found. Add your first book!</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" id="books-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>ISBN</th>
                      <th>Copies</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(book => (
                      <tr key={book.id}>
                        <td style={{ fontWeight: 600, minWidth: '200px' }}>{book.title}</td>
                        <td>{book.author}</td>
                        <td>
                          <span className="badge badge-category">{book.category || '—'}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{book.isbn || '—'}</td>
                        <td>
                          <span className={`badge ${book.available_copies > 0 ? 'badge-available' : 'badge-unavailable'}`}>
                            {book.available_copies}/{book.total_copies}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <Link
                              to={`/read/${book.id}`}
                              className="btn btn-sm"
                              style={{ background: 'var(--primary-600)', color: 'white', border: 'none' }}
                              id={`btn-read-${book.id}`}
                            >
                              📖 Read
                            </Link>
                            <Link
                              to={`/admin/books/${book.id}`}
                              className="btn btn-sm btn-outline"
                              id={`btn-view-${book.id}`}
                            >
                              👁️ View
                            </Link>
                            <Link
                              to={`/admin/books/${book.id}/edit`}
                              className="btn btn-sm btn-outline"
                              id={`btn-edit-${book.id}`}
                            >
                              ✏️ Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => setDeleteModal({ open: true, book })}
                              id={`btn-delete-${book.id}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={deleteModal.open}
        title="Delete Book"
        message={`Are you sure you want to delete "${deleteModal.book?.title}"? This action cannot be undone.`}
        icon="🗑️"
        iconClass="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmClass="btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, book: null })}
        loading={deleteLoading}
      />
    </>
  );
}
