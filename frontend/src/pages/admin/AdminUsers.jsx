import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API}/admin/users`, { headers });
        setUsers(res.data.users || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.first_name.toLowerCase().includes(s) || u.last_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <>
      <Header />
      <main className="page-content" id="admin-users-page">
        <div className="welcome-section">
          <span className="welcome-emoji">👥</span>
          <h1 className="welcome-title">User Management</h1>
          <p className="welcome-subtitle">View and manage library members</p>
        </div>

        <div className="card card-wide" style={{ }}>
          <div className="filter-bar">
            <input type="text" className="form-input" placeholder="Search by name or email..."
              value={search} onChange={(e) => setSearch(e.target.value)} id="user-search" />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active Borrows</th><th>Library</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.first_name} {u.last_name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'system_admin' ? 'badge-unavailable' : 'badge-available'}`}>
                          {u.role === 'system_admin' ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{u.active_reservations}</td>
                      <td style={{ textAlign: 'center' }}>{u.library_count}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
