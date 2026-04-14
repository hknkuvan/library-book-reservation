import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="header" id="main-header">
      <Link to={isAdmin ? '/admin' : '/home'} className="header-logo">
        <div className="header-logo-icon">📚</div>
        <span className="header-logo-text">LibrarySystem</span>
      </Link>

      <nav className="header-nav">
        {isAdmin ? (
          <>
            <Link to="/admin" className="nav-link" id="nav-admin-dashboard">Dashboard</Link>
            <Link to="/admin/books" className="nav-link" id="nav-admin-books">Books</Link>
            <Link to="/admin/reservations" className="nav-link" id="nav-admin-reservations">Reservations</Link>
            <Link to="/admin/users" className="nav-link" id="nav-admin-users">Users</Link>
          </>
        ) : (
          <>
            <Link to="/home" className="nav-link" id="nav-home">Home</Link>
            <Link to="/books" className="nav-link" id="nav-browse">Browse</Link>
            <Link to="/my-library" className="nav-link" id="nav-library">My Books</Link>
            <Link to="/reservations" className="nav-link" id="nav-reservations">Reservations</Link>
            <Link to="/profile" className="nav-link" id="nav-profile">Profile</Link>
          </>
        )}

        <div className="header-user">
          <div className="profile-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
            {getInitials()}
          </div>
          <span className="header-user-name">{user?.first_name} {user?.last_name}</span>
          <span className={`header-user-role ${isAdmin ? 'admin' : 'user'}`}>
            {isAdmin ? 'Admin' : 'Member'}
          </span>
        </div>

        <button
          className="btn btn-logout"
          onClick={handleLogout}
          id="btn-logout"
        >
          🚪 Logout
        </button>
      </nav>
    </header>
  );
}
