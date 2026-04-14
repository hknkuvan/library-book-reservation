import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Home() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ reservations: 0, library: 0, books: 0 });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const fetchStats = async () => {
      try {
        const [resData, libData, booksData] = await Promise.all([
          axios.get(`${API}/reservations/my`, { headers }).catch(() => ({ data: { reservations: [] } })),
          axios.get(`${API}/user-books`, { headers }).catch(() => ({ data: { books: [] } })),
          axios.get(`${API}/books`, { headers, params: { limit: 1 } }).catch(() => ({ data: { pagination: { total: 0 } } }))
        ]);
        setStats({
          reservations: (resData.data.reservations || []).filter(r => r.status === 'active' || r.status === 'overdue').length,
          library: (libData.data.books || []).length,
          books: resData.data.reservations ? booksData.data.pagination?.total || 0 : 0
        });
      } catch (e) { /* ignore */ }
    };
    fetchStats();
  }, [token]);

  const cards = [
    { id: 'search-books', icon: '🔍', title: 'Search Books', desc: 'Search our collection by title, author, or category.', to: '/books', color: 'rgba(99, 102, 241, 0.15)' },
    { id: 'my-reservations', icon: '📋', title: 'My Reservations', desc: `You have ${stats.reservations} active reservation${stats.reservations !== 1 ? 's' : ''}.`, to: '/reservations', color: 'rgba(16, 185, 129, 0.15)' },
    { id: 'personal-library', icon: '📖', title: 'Personal Library', desc: `${stats.library} book${stats.library !== 1 ? 's' : ''} in your library.`, to: '/my-library', color: 'rgba(245, 158, 11, 0.15)' },
    { id: 'availability', icon: '✅', title: 'Book Availability', desc: 'Check if a book is available or currently borrowed.', to: '/books', color: 'rgba(139, 92, 246, 0.15)' },
    { id: 'new-arrivals', icon: '✨', title: 'New Arrivals', desc: 'Discover the latest books added to our collection.', to: '/new-arrivals', color: 'rgba(236, 72, 153, 0.15)' },
    { id: 'reading-stats', icon: '📊', title: 'Reading Stats', desc: 'View your reading statistics and track goals.', to: '/stats', color: 'rgba(6, 182, 212, 0.15)' },
  ];

  return (
    <>
      <Header />
      <main className="page-content" id="home-page">
        <div className="welcome-section">
          <span className="welcome-emoji">📚</span>
          <h1 className="welcome-title">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="welcome-subtitle">
            Explore our library collection, manage your reservations, and discover new books to read.
          </p>
        </div>

        <div className="dashboard-grid">
          {cards.map(card => (
            <Link to={card.to} className="dashboard-card" id={`card-${card.id}`} key={card.id}
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
