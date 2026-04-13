import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function Home() {
  const { user } = useAuth();

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
          <div className="dashboard-card" id="card-search-books">
            <div className="dashboard-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
              🔍
            </div>
            <h3 className="dashboard-card-title">Search Books</h3>
            <p className="dashboard-card-desc">
              Search our collection by title, author, or category. Find your next favorite book.
            </p>
          </div>

          <div className="dashboard-card" id="card-my-reservations">
            <div className="dashboard-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              📋
            </div>
            <h3 className="dashboard-card-title">My Reservations</h3>
            <p className="dashboard-card-desc">
              View and manage your current book reservations and borrowing history.
            </p>
          </div>

          <div className="dashboard-card" id="card-personal-library">
            <div className="dashboard-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              📖
            </div>
            <h3 className="dashboard-card-title">Personal Library</h3>
            <p className="dashboard-card-desc">
              Track books you've read, create reading lists, and write reviews.
            </p>
          </div>

          <div className="dashboard-card" id="card-availability">
            <div className="dashboard-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              ✅
            </div>
            <h3 className="dashboard-card-title">Book Availability</h3>
            <p className="dashboard-card-desc">
              Check if a book is available or currently borrowed by another member.
            </p>
          </div>

          <div className="dashboard-card" id="card-new-arrivals">
            <div className="dashboard-card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
              ✨
            </div>
            <h3 className="dashboard-card-title">New Arrivals</h3>
            <p className="dashboard-card-desc">
              Discover the latest books added to our library collection.
            </p>
          </div>

          <div className="dashboard-card" id="card-reading-stats">
            <div className="dashboard-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              📊
            </div>
            <h3 className="dashboard-card-title">Reading Stats</h3>
            <p className="dashboard-card-desc">
              View your reading statistics and track your annual reading goals.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
