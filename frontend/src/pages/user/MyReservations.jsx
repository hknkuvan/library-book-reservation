import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function MyReservations() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axios.get(`${API}/reservations/my`, { headers, params });
      setReservations(res.data.reservations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, [filter]);

  const handleReturn = async (id) => {
    try {
      await axios.put(`${API}/reservations/${id}/return`, {}, { headers });
      success('Book returned successfully!');
      fetchReservations();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to return.');
    }
  };

  const getDaysLeft = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const active = reservations.filter(r => r.status === 'active' || r.status === 'overdue');
  const returned = reservations.filter(r => r.status === 'returned');

  return (
    <>
      <Header />
      <main className="page-content" id="my-reservations-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📋</span>
          <h1 className="welcome-title">My Reservations</h1>
          <p className="welcome-subtitle">Track your borrowed books and return history</p>
        </div>

        {/* Removing local msg alert to use global toast */}

        <div className="card card-wide">
          <div className="tab-bar">
            {['all', 'active', 'returned'].map(f => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setLoading(true); }}>
                {f === 'all' ? '📚 All' : f === 'active' ? '📖 Active' : '✅ Returned'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : reservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No reservations found.</p>
              <Link to="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Books</Link>
            </div>
          ) : (
            <>
              {active.length > 0 && (filter === 'all' || filter === 'active') && (
                <>
                  <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    📖 Active ({active.length})
                  </h3>
                  <div className="reservation-list">
                    {active.map(r => {
                      const days = getDaysLeft(r.due_date);
                      return (
                        <div className={`reservation-card ${r.status === 'overdue' ? 'overdue' : ''}`} key={r.id}>
                          <div className="reservation-info">
                            <Link to={`/books/${r.book_id}`} className="reservation-title">{r.book_title}</Link>
                            <span className="reservation-author">by {r.book_author}</span>
                            <div className="reservation-dates">
                              <span>Borrowed: {new Date(r.borrowed_at).toLocaleDateString()}</span>
                              <span>Due: {new Date(r.due_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="reservation-status">
                            <span className={`countdown-badge ${days < 0 ? 'overdue' : days <= 3 ? 'warning' : 'ok'}`}>
                              {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                            </span>
                            <button className="btn btn-primary btn-sm" onClick={() => handleReturn(r.id)}>
                              📥 Return
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {returned.length > 0 && (filter === 'all' || filter === 'returned') && (
                <>
                  <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    ✅ Returned ({returned.length})
                  </h3>
                  <div className="reservation-list">
                    {returned.map(r => (
                      <div className="reservation-card returned" key={r.id}>
                        <div className="reservation-info">
                          <Link to={`/books/${r.book_id}`} className="reservation-title">{r.book_title}</Link>
                          <span className="reservation-author">by {r.book_author}</span>
                          <div className="reservation-dates">
                            <span>Borrowed: {new Date(r.borrowed_at).toLocaleDateString()}</span>
                            <span>Returned: {new Date(r.returned_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="badge badge-available">Returned</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
