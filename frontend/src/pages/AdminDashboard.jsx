import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <main className="page-content" id="admin-dashboard-page">
        <div className="welcome-section">
          <span className="welcome-emoji">🛡️</span>
          <h1 className="welcome-title">
            Admin Dashboard
          </h1>
          <p className="welcome-subtitle">
            Welcome, {user?.first_name}. Manage the library catalog, users, and system settings.
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card" id="admin-card-manage-books">
            <div className="dashboard-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
              📚
            </div>
            <h3 className="dashboard-card-title">Manage Books</h3>
            <p className="dashboard-card-desc">
              Add, update, or remove books from the library catalog.
            </p>
          </div>

          <div className="dashboard-card" id="admin-card-manage-users">
            <div className="dashboard-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              👥
            </div>
            <h3 className="dashboard-card-title">Manage Users</h3>
            <p className="dashboard-card-desc">
              View and manage library member accounts and their profiles.
            </p>
          </div>

          <div className="dashboard-card" id="admin-card-reservations">
            <div className="dashboard-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              📋
            </div>
            <h3 className="dashboard-card-title">Reservations</h3>
            <p className="dashboard-card-desc">
              View all active borrowing and reservation records in the system.
            </p>
          </div>

          <div className="dashboard-card" id="admin-card-reports">
            <div className="dashboard-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              📊
            </div>
            <h3 className="dashboard-card-title">Reports</h3>
            <p className="dashboard-card-desc">
              View borrowing and reservation reports with analytics and insights.
            </p>
          </div>

          <div className="dashboard-card" id="admin-card-properties">
            <div className="dashboard-card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
              ⚙️
            </div>
            <h3 className="dashboard-card-title">System Settings</h3>
            <p className="dashboard-card-desc">
              Configure library policies, borrowing limits, and notification settings.
            </p>
          </div>

          <div className="dashboard-card" id="admin-card-availability">
            <div className="dashboard-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              📦
            </div>
            <h3 className="dashboard-card-title">Book Availability</h3>
            <p className="dashboard-card-desc">
              Monitor book availability status and manage inventory tracking.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
