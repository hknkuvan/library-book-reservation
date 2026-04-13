import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ textAlign: 'center' }}>
          <div className="btn spinner" style={{ width: 40, height: 40, margin: '0 auto', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366F1' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
