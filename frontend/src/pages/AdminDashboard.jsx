import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API}/admin/stats`, { headers })
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, [token]);

  const cards = [
    { id: 'manage-books', icon: '📚', title: 'Manage Books', desc: `${stats?.totalBooks || '...'} books in catalog.`, to: '/admin/books', color: 'rgba(99, 102, 241, 0.15)' },
    { id: 'manage-users', icon: '👥', title: 'Manage Users', desc: `${stats?.totalUsers || '...'} registered members.`, to: '/admin/users', color: 'rgba(16, 185, 129, 0.15)' },
    { id: 'reservations', icon: '📋', title: 'Reservations', desc: `${stats?.activeRes || 0} active, ${stats?.overdueRes || 0} overdue.`, to: '/admin/reservations', color: 'rgba(245, 158, 11, 0.15)' },
    { id: 'reports', icon: '📊', title: 'Reports & Analytics', desc: `${stats?.totalRes || 0} total reservations processed.`, to: '/admin/stats', color: 'rgba(139, 92, 246, 0.15)' },
    { id: 'submissions', icon: '📬', title: 'Pending Submissions', desc: `${stats?.pendingBooks || 0} book${stats?.pendingBooks !== 1 ? 's' : ''} awaiting approval.`, to: '/admin/submissions', color: 'rgba(245, 158, 11, 0.15)' },
    { id: 'availability', icon: '📦', title: 'New Arrivals', desc: `${stats?.recentBooks || 0} new books in last 30 days.`, to: '/admin/books', color: 'rgba(6, 182, 212, 0.15)' },
  ];

  return (
    <>
      <Header />
      <main className="page-content" id="admin-dashboard-page">
        <div className="welcome-section">
          <span className="welcome-emoji">🛡️</span>
          <h1 className="welcome-title">Admin Dashboard</h1>
          <p className="welcome-subtitle">
            Welcome, {user?.first_name}. Manage the library catalog, users, and system settings.
          </p>
        </div>

        <div className="dashboard-grid">
          {cards.map(card => (
            <Link to={card.to} className="dashboard-card" id={`admin-card-${card.id}`} key={card.id}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="dashboard-card-icon" style={{ background: card.color }}>
                {card.icon}
              </div>
              <h3 className="dashboard-card-title">{card.title}</h3>
              <p className="dashboard-card-desc">{card.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
