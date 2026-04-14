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
// Admin pages
import BookList from './pages/admin/BookList';
import BookCreate from './pages/admin/BookCreate';
import BookDetail from './pages/admin/BookDetail';
import BookEdit from './pages/admin/BookEdit';
import AdminReservations from './pages/admin/AdminReservations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStats from './pages/admin/AdminStats';
// User pages
import BrowseBooks from './pages/user/BrowseBooks';
import BookDetailUser from './pages/user/BookDetailUser';
import MyReservations from './pages/user/MyReservations';
import PersonalLibrary from './pages/user/PersonalLibrary';
import NewArrivals from './pages/user/NewArrivals';
import ReadingStats from './pages/user/ReadingStats';
import EReader from './pages/user/EReader';

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
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute><BrowseBooks /></ProtectedRoute>} />
      <Route path="/books/:id" element={<ProtectedRoute><BookDetailUser /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
      <Route path="/my-library" element={<ProtectedRoute><PersonalLibrary /></ProtectedRoute>} />
      <Route path="/new-arrivals" element={<ProtectedRoute><NewArrivals /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><ReadingStats /></ProtectedRoute>} />
      <Route path="/read/:id" element={<ProtectedRoute><EReader /></ProtectedRoute>} />
      <Route path="/read/:id/:chapterNumber" element={<ProtectedRoute><EReader /></ProtectedRoute>} />

      {/* Protected routes - Admin */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/books" element={<ProtectedRoute requireAdmin><BookList /></ProtectedRoute>} />
      <Route path="/admin/books/create" element={<ProtectedRoute requireAdmin><BookCreate /></ProtectedRoute>} />
      <Route path="/admin/books/:id" element={<ProtectedRoute requireAdmin><BookDetail /></ProtectedRoute>} />
      <Route path="/admin/books/:id/edit" element={<ProtectedRoute requireAdmin><BookEdit /></ProtectedRoute>} />
      <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><AdminReservations /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute requireAdmin><AdminStats /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
