import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReadingStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/user-books/stats`, { headers });
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
      <main className="page-content"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load stats.</p></main>
    </>
  );

  // Build monthly chart data
  const monthlyData = Array(12).fill(0);
  (stats.monthly || []).forEach(m => { monthlyData[m.month - 1] = m.count; });
  const maxMonthly = Math.max(...monthlyData, 1);

  return (
    <>
      <Header />
      <main className="page-content" id="reading-stats-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📊</span>
          <h1 className="welcome-title">Reading Statistics</h1>
          <p className="welcome-subtitle">Track your reading progress and achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid" style={{ }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>📚</div>
            <div className="stat-value">{stats.totalRead}</div>
            <div className="stat-label">Books Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>📖</div>
            <div className="stat-value">{stats.totalReading}</div>
            <div className="stat-label">Currently Reading</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>📋</div>
            <div className="stat-value">{stats.totalWant}</div>
            <div className="stat-label">Want to Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>📄</div>
            <div className="stat-value">{stats.totalPages.toLocaleString()}</div>
            <div className="stat-label">Pages Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>⭐</div>
            <div className="stat-value">{stats.avgRating || '—'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>🏷️</div>
            <div className="stat-value">{stats.totalBooks}</div>
            <div className="stat-label">In Library</div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📈 Monthly Reading ({new Date().getFullYear()})</h3>
          <div className="bar-chart">
            {monthlyData.map((count, i) => (
              <div className="bar-col" key={i}>
                <div className="bar-wrapper">
                  <div className="bar"
                    style={{ height: `${(count / maxMonthly) * 100}%` }}
                    title={`${MONTH_NAMES[i]}: ${count} books`}>
                    {count > 0 && <span className="bar-value">{count}</span>}
                  </div>
                </div>
                <span className="bar-label">{MONTH_NAMES[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        {stats.categories && stats.categories.length > 0 && (
          <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🏷️ Categories Read</h3>
            <div className="category-bars">
              {stats.categories.map((cat, i) => (
                <div className="category-row" key={i}>
                  <span className="category-name">{cat.category}</span>
                  <div className="category-bar-wrapper">
                    <div className="category-bar"
                      style={{ width: `${(cat.count / stats.categories[0].count) * 100}%` }}>
                    </div>
                  </div>
                  <span className="category-count">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Reads */}
        {stats.recentReads && stats.recentReads.length > 0 && (
          <div className="card card-wide" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📖 Recently Read</h3>
            <div className="reservation-list">
              {stats.recentReads.map((book, i) => (
                <div className="reservation-card" key={i}>
                  <div className="reservation-info">
                    <Link to={`/books/${book.book_id}`} className="reservation-title">{book.title}</Link>
                    <span className="reservation-author">by {book.author} • {book.pages || '?'} pages</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {book.rating && <span className="star-display">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</span>}
                    {book.category && <span className="badge badge-category">{book.category}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalRead === 0 && (
          <div className="card card-wide" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Start reading to see your statistics!</p>
            <Link to="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Books</Link>
          </div>
        )}
      </main>
    </>
  );
}
