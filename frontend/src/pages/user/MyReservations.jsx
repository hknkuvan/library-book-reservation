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
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/reservations/my`, { headers });
      setReservations(res.data.reservations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleReturn = async (id) => {
    try {
      await axios.put(`${API}/reservations/${id}/return`, {}, { headers });
      success('Book returned successfully!');
      fetchReservations();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to return.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`${API}/reservations/${id}`, { headers });
      success('Reservation cancelled.');
      fetchReservations();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to cancel.');
    }
  };

  const getDaysLeft = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const active = reservations.filter(r => r.status === 'active' || r.status === 'overdue');
  const history = reservations.filter(r => r.status === 'returned' || r.status === 'cancelled');

  const tabData = { active, history };
  const shown = tabData[tab] || [];

  const tabs = [
    { key: 'active', label: '📖 Active', count: active.length },
    { key: 'history', label: '🕓 History', count: history.length },
  ];

  return (
    <>
      <Header />
      <main className="page-content" id="my-reservations-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📋</span>
          <h1 className="welcome-title">My Reservations</h1>
          <p className="welcome-subtitle">Track your borrowed books and reservation history</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Borrowed', value: reservations.length, color: 'var(--primary-400)' },
            { label: 'Currently Active', value: active.length, color: '#22c55e' },
            { label: 'Returned', value: reservations.filter(r => r.status === 'returned').length, color: 'var(--text-secondary)' },
            { label: 'Cancelled', value: reservations.filter(r => r.status === 'cancelled').length, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 120px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card card-wide">
          <div className="tab-bar">
            {tabs.map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}>
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    marginLeft: '0.4rem', background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-elevated)',
                    borderRadius: '999px', fontSize: '0.72rem', padding: '1px 7px', color: 'inherit'
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                {tab === 'active' ? 'No active reservations.' : 'No reservation history yet.'}
              </p>
              {tab === 'active' && (
                <Link to="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Books</Link>
              )}
            </div>
          ) : tab === 'active' ? (
            <div className="reservation-list">
              {shown.map(r => {
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
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleReturn(r.id)}>
                          📥 Return
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                          onClick={() => handleCancel(r.id)}>
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* History tab */
            <div className="reservation-list">
              {shown.map(r => (
                <div className={`reservation-card ${r.status === 'cancelled' ? '' : 'returned'}`} key={r.id}
                  style={{ opacity: r.status === 'cancelled' ? 0.75 : 1 }}>
                  <div className="reservation-info">
                    <Link to={`/books/${r.book_id}`} className="reservation-title">{r.book_title}</Link>
                    <span className="reservation-author">by {r.book_author}</span>
                    <div className="reservation-dates">
                      <span>Borrowed: {new Date(r.borrowed_at).toLocaleDateString()}</span>
                      {r.status === 'returned' && r.returned_at && (
                        <span>Returned: {new Date(r.returned_at).toLocaleDateString()}</span>
                      )}
                      {r.status === 'cancelled' && r.returned_at && (
                        <span>Cancelled: {new Date(r.returned_at).toLocaleDateString()}</span>
                      )}
                      <span>Due was: {new Date(r.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`badge ${r.status === 'returned' ? 'badge-available' : ''}`}
                    style={r.status === 'cancelled' ? { background: 'var(--bg-elevated)', color: '#f59e0b', border: '1px solid #f59e0b' } : {}}>
                    {r.status === 'returned' ? '✅ Returned' : '✕ Cancelled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
