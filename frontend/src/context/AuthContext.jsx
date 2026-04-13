import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add auth header interceptor
  api.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  // Load user profile on mount if token exists
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/profile');
      setUser(res.data.user);
      setToken(storedToken);
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Register
  const register = async (userData) => {
    const res = await api.post('/register', userData);
    return res.data;
  };

  // Login
  const login = async (credentials) => {
    const res = await api.post('/login', credentials);
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Even if backend fails, clear local state
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    const res = await api.put('/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  // Delete account
  const deleteAccount = async () => {
    const res = await api.delete('/profile');
    if (res.data.success) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'system_admin',
    register,
    login,
    logout,
    updateProfile,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
