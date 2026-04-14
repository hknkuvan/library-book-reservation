import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AdminStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/admin/stats`, { headers });
        setStats(res.data.stats);
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

  const cards = [
    { icon: '📚', value: stats.totalBooks, label: 'Total Books', color: 'rgba(99, 102, 241, 0.15)' },
    { icon: '👥', value: stats.totalUsers, label: 'Members', color: 'rgba(16, 185, 129, 0.15)' },
    { icon: '📖', value: stats.activeRes, label: 'Active Borrows', color: 'rgba(245, 158, 11, 0.15)' },
    { icon: '⚠️', value: stats.overdueRes, label: 'Overdue', color: 'rgba(239, 68, 68, 0.15)' },
    { icon: '✅', value: stats.returnedRes, label: 'Returned', color: 'rgba(139, 92, 246, 0.15)' },
    { icon: '📋', value: stats.totalRes, label: 'Total Reservations', color: 'rgba(6, 182, 212, 0.15)' },
    { icon: '✨', value: stats.recentBooks, label: 'New (30 days)', color: 'rgba(236, 72, 153, 0.15)' },
  ];

  return (
    <>
      <Header />
      <main className="page-content" id="admin-stats-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📊</span>
          <h1 className="welcome-title">Reports & Statistics</h1>
          <p className="welcome-subtitle">Library analytics overview</p>
        </div>

        <div className="stats-grid" style={{ }}>
          {cards.map((c, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: c.color }}>{c.icon}</div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
          <h3>📈 System Overview</h3>
          <div className="detail-grid" style={{ marginTop: '1rem' }}>
            <div className="detail-item">
              <span className="detail-label">Borrow Rate</span>
              <span className="detail-value">{stats.totalRes > 0 ? Math.round((stats.returnedRes / stats.totalRes) * 100) : 0}% returned</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Overdue Rate</span>
              <span className="detail-value text-error">{stats.totalRes > 0 ? Math.round((stats.overdueRes / stats.totalRes) * 100) : 0}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Books per Member</span>
              <span className="detail-value">{stats.totalUsers > 0 ? (stats.totalBooks / stats.totalUsers).toFixed(1) : '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Active per Member</span>
              <span className="detail-value">{stats.totalUsers > 0 ? (stats.activeRes / stats.totalUsers).toFixed(1) : '—'}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
