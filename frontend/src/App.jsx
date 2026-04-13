import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import BookList from './pages/admin/BookList';
import BookCreate from './pages/admin/BookCreate';
import BookDetail from './pages/admin/BookDetail';
import BookEdit from './pages/admin/BookEdit';

function AppRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Loading Library System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/home'} replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/home'} replace />
            : <Register />
        }
      />
      <Route
        path="/forgot-password"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/home'} replace />
            : <ForgotPassword />
        }
      />
      <Route
        path="/reset-password"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/home'} replace />
            : <ResetPassword />
        }
      />

      {/* Protected routes - End User */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Protected routes - Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/books" element={
        <ProtectedRoute requireAdmin>
          <BookList />
        </ProtectedRoute>
      } />
      <Route path="/admin/books/create" element={
        <ProtectedRoute requireAdmin>
          <BookCreate />
        </ProtectedRoute>
      } />
      <Route path="/admin/books/:id" element={
        <ProtectedRoute requireAdmin>
          <BookDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/books/:id/edit" element={
        <ProtectedRoute requireAdmin>
          <BookEdit />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
