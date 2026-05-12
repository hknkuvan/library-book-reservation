import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/admin/stats`, { headers });
        setStats(res.data.stats);
        setMonthlyStats(res.data.monthlyStats || []);
        setPopularBooks(res.data.popularBooks || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <>
      <Header />
      <main className="page-content"><div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div></main>
    </>
  );

  if (!stats) return (
    <>
      <Header />
      <main className="page-content"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load statistics.</p></main>
    </>
  );

  const summaryCards = [
    { icon: '📚', value: stats.totalBooks, label: 'Active Books', color: 'rgba(99, 102, 241, 0.15)' },
    { icon: '👥', value: stats.totalUsers, label: 'Members', color: 'rgba(16, 185, 129, 0.15)' },
    { icon: '📖', value: stats.activeRes, label: 'Active Borrows', color: 'rgba(245, 158, 11, 0.15)' },
    { icon: '⚠️', value: stats.overdueRes, label: 'Overdue', color: 'rgba(239, 68, 68, 0.15)' },
    { icon: '✅', value: stats.returnedRes, label: 'Returned', color: 'rgba(139, 92, 246, 0.15)' },
    { icon: '📋', value: stats.totalRes, label: 'Total Reservations', color: 'rgba(6, 182, 212, 0.15)' },
    { icon: '✨', value: stats.recentBooks, label: 'New (30 days)', color: 'rgba(236, 72, 153, 0.15)' },
    { icon: '📬', value: stats.pendingBooks, label: 'Pending Submissions', color: 'rgba(245, 158, 11, 0.15)' },
  ];

  // Build monthly data map for chart
  const maxCount = monthlyStats.length > 0 ? Math.max(...monthlyStats.map(m => m.count), 1) : 1;
  const monthMap = {};
  monthlyStats.forEach(m => { monthMap[m.month] = m.count; });

  return (
    <>
      <Header />
      <main className="page-content" id="admin-stats-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📊</span>
          <h1 className="welcome-title">Reports & Analytics</h1>
          <p className="welcome-subtitle">Library analytics overview</p>
        </div>

        {/* Summary Cards */}
        <div className="stats-grid">
          {summaryCards.map((c, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: c.color }}>{c.icon}</div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* System Overview */}
        <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📈 System Overview</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Return Rate</span>
              <span className="detail-value">{stats.totalRes > 0 ? Math.round((stats.returnedRes / stats.totalRes) * 100) : 0}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Overdue Rate</span>
              <span className="detail-value" style={{ color: 'var(--error-400)' }}>{stats.totalRes > 0 ? Math.round((stats.overdueRes / stats.totalRes) * 100) : 0}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Books per Member</span>
              <span className="detail-value">{stats.totalUsers > 0 ? (stats.totalBooks / stats.totalUsers).toFixed(1) : '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active per Member</span>
              <span className="detail-value">{stats.totalUsers > 0 ? (stats.activeRes / stats.totalUsers).toFixed(1) : '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Archived Books</span>
              <span className="detail-value">{stats.archivedBooks}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pending Approvals</span>
              <span className="detail-value" style={{ color: stats.pendingBooks > 0 ? 'var(--warning-400)' : 'inherit' }}>{stats.pendingBooks}</span>
            </div>
          </div>
        </div>

        {/* Monthly Reservation Chart */}
        <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📅 Monthly Reservations (Last 12 Months)</h3>
          {monthlyStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reservation data yet.</p>
          ) : (
            <>
              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 120, marginBottom: '0.5rem', overflowX: 'auto' }}>
                {monthlyStats.map((m, i) => {
                  const [year, monthNum] = m.month.split('-');
                  const label = `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year.slice(2)}`;
                  const barHeight = Math.max(4, Math.round((m.count / maxCount) * 100));
                  return (
                    <div key={i} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{m.count}</span>
                      <div style={{ width: '100%', height: `${barHeight}px`, background: 'var(--primary-500)', borderRadius: '4px 4px 0 0', minHeight: 4 }}></div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Table */}
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Reservations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...monthlyStats].reverse().map((m, i) => {
                      const [year, monthNum] = m.month.split('-');
                      return (
                        <tr key={i}>
                          <td>{MONTH_NAMES[parseInt(monthNum) - 1]} {year}</td>
                          <td><strong>{m.count}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Most Popular Books */}
        <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🏆 Most Reserved Books</h3>
          {popularBooks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reservation data yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Total Reservations</th>
                  </tr>
                </thead>
                <tbody>
                  {popularBooks.map((book, i) => (
                    <tr key={book.id}>
                      <td style={{ fontWeight: 700, color: i < 3 ? 'var(--accent-400)' : 'var(--text-secondary)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{book.title}</td>
                      <td>{book.author}</td>
                      <td><span className="badge badge-category">{book.category || '—'}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{book.reservation_count}</span>
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
