import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AdminReservations() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const [resData, statsData] = await Promise.all([
        axios.get(`${API}/reservations`, { headers, params }),
        axios.get(`${API}/reservations/stats`, { headers })
      ]);
      setReservations(resData.data.reservations || []);
      setStats(statsData.data.stats);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter, search]);

  const handleForceReturn = async (id) => {
    try {
      await axios.put(`${API}/reservations/${id}/return`, {}, { headers });
      setMsg('✅ Book returned.');
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Failed.')); }
  };

  return (
    <>
      <Header />
      <main className="page-content" id="admin-reservations-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📋</span>
          <h1 className="welcome-title">All Reservations</h1>
          <p className="welcome-subtitle">Manage borrowing and returns</p>
        </div>

        {stats && (
          <div className="stats-grid small" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card mini"><div className="stat-value">{stats.total}</div><div className="stat-label">Total</div></div>
            <div className="stat-card mini"><div className="stat-value text-success">{stats.active}</div><div className="stat-label">Active</div></div>
            <div className="stat-card mini"><div className="stat-value text-error">{stats.overdue}</div><div className="stat-label">Overdue</div></div>
            <div className="stat-card mini"><div className="stat-value">{stats.returned}</div><div className="stat-label">Returned</div></div>
          </div>
        )}

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ maxWidth: '1100px', margin: '0 auto 1rem' }}>{msg}</div>}

        <div className="card card-wide" style={{ }}>
          <div className="filter-bar">
            <input type="text" className="form-input" placeholder="Search user or book..."
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 2 }} />
            <select className="form-input" value={filter} onChange={(e) => { setFilter(e.target.value); setLoading(true); }} style={{ flex: 1 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>User</th><th>Book</th><th>Borrowed</th><th>Due Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No reservations found.</td></tr>
                  ) : reservations.map(r => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{r.first_name} {r.last_name}<br/><small style={{color:'var(--text-muted)'}}>{r.email}</small></td>
                      <td><Link to={`/admin/books/${r.book_id}`} style={{color:'var(--primary-400)'}}>{r.book_title}</Link></td>
                      <td>{new Date(r.borrowed_at).toLocaleDateString()}</td>
                      <td>{new Date(r.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${r.status === 'active' ? 'badge-available' : r.status === 'overdue' ? 'badge-unavailable' : 'badge-category'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {(r.status === 'active' || r.status === 'overdue') && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleForceReturn(r.id)}>📥 Return</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
