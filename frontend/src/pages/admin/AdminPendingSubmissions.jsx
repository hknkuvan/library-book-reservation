import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AdminPendingSubmissions() {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API}/books/pending`, { headers });
      setBooks(res.data.books || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({ title: book.title, author: book.author, category: book.category || '', isbn: book.isbn || '', description: book.description || '', cover_image: book.cover_image || '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleApprove = async (bookId) => {
    try {
      const fields = editingId === bookId ? editForm : {};
      await axios.put(`${API}/books/${bookId}/approve`, fields, { headers });
      success('Book approved and added to catalog!');
      setEditingId(null);
      fetchPending();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to approve.');
    }
  };

  const handleReject = async (bookId) => {
    if (!window.confirm('Reject this submission? It will be removed from the pending queue.')) return;
    try {
      await axios.put(`${API}/books/${bookId}/reject`, {}, { headers });
      success('Submission rejected.');
      fetchPending();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to reject.');
    }
  };

  return (
    <>
      <Header />
      <main className="page-content" id="pending-submissions-page">
        <div style={{ width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              📬 Pending Book Submissions
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Review and approve or reject user-submitted books
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            </div>
          ) : books.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <span style={{ fontSize: '3rem' }}>✅</span>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No pending submissions. All caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {books.map(book => (
                <div key={book.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Cover preview */}
                    <div style={{ width: 60, height: 85, background: 'var(--primary-600)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      {book.cover_image ? <img src={book.cover_image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} /> : book.title.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem' }}>{book.title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.1rem 0' }}>by {book.author}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Submitted by: {book.first_name ? `${book.first_name} ${book.last_name} (${book.email})` : 'Unknown'}
                            {' · '}{new Date(book.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => editingId === book.id ? setEditingId(null) : startEdit(book)}>
                            {editingId === book.id ? '✖ Cancel Edit' : '✏️ Edit'}
                          </button>
                          <button className="btn btn-sm" style={{ background: 'var(--success-500)', color: 'white', border: 'none' }} onClick={() => handleApprove(book.id)}>
                            ✅ Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleReject(book.id)}>
                            ❌ Reject
                          </button>
                        </div>
                      </div>

                      {/* Inline metadata (collapsed view) */}
                      {editingId !== book.id && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {book.category && <span>📂 {book.category}</span>}
                          {book.isbn && <span>🔢 {book.isbn}</span>}
                          {book.description && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>📝 {book.description}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {editingId === book.id && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Edit details before approving:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Title</label>
                          <input type="text" name="title" className="form-input" value={editForm.title} onChange={handleEditChange} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Author</label>
                          <input type="text" name="author" className="form-input" value={editForm.author} onChange={handleEditChange} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Category</label>
                          <input type="text" name="category" className="form-input" value={editForm.category} onChange={handleEditChange} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>ISBN</label>
                          <input type="text" name="isbn" className="form-input" value={editForm.isbn} onChange={handleEditChange} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Cover Image URL</label>
                          <input type="url" name="cover_image" className="form-input" value={editForm.cover_image} onChange={handleEditChange} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Description</label>
                          <textarea name="description" className="form-input" rows={3} value={editForm.description} onChange={handleEditChange} style={{ resize: 'vertical' }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--success-500)', color: 'white', border: 'none' }} onClick={() => handleApprove(book.id)}>
                          ✅ Save & Approve
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
