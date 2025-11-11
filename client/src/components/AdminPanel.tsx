import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { createMunicipalityUser, listMunicipalityUsers, deleteMunicipalityUser } from '../api/api';
import type { MunicipalityUserRequest, MunicipalityUserResponse } from '../../../shared/MunicipalityUserTypes';
import { PersonPlus, Trash, People } from 'react-bootstrap-icons';
import '../styles/AdminPanel.css';

const INITIAL_FORM_STATE: MunicipalityUserRequest = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'PUBLIC_RELATIONS'
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<MunicipalityUserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MunicipalityUserRequest>(INITIAL_FORM_STATE);

  const isAdmin = isAuthenticated && user?.role === 'ADMINISTRATOR';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listMunicipalityUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createMunicipalityUser(formData);
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      setError('');
      await deleteMunicipalityUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) resetForm();
  };

  // TODO: PT03 - Uncomment this function when role display is re-enabled
  // FIXME: Currently commented out to avoid unused variable warning in PT02
  /*
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PUBLIC_RELATIONS': return 'Public Relations';
      case 'TECHNICAL_OFFICE': return 'Technical Office';
      default: return role;
    }
  };
  */

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-card">
        <div className="admin-header">
          <h2><People /> Municipality Users</h2>
          <button 
            onClick={toggleForm} 
            className="add-user-btn"
            disabled={loading}
          >
            <PersonPlus /> {showForm ? 'Cancel' : 'Add New User'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            {/* TODO: PT03 - Uncomment to enable role selection when implementing "assign roles" feature */}
            {/* FIXME: Currently hidden for PT02 - users are created with PUBLIC_RELATIONS role by default */}
            {/* 
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                */}
            {/* FIXME: Qunado ci sarà la api che restituisce tutti i ruoli prendili da lì! */}
            {/*
                <option value="PUBLIC_RELATIONS">Public Relations</option>
                <option value="TECHNICAL_OFFICE">Technical Office</option>
              </select>
            </div>
            */}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        <div className="users-list">
          <h3>Registered Municipality Users ({users.length})</h3>
          
          {loading && users.length === 0 ? (
            <div className="loading-message">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-message">No municipality users yet</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {/* TODO: PT03 - Uncomment to show role column when implementing "assign roles" feature */}
                  {/* <th>Role</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    {/* TODO: PT03 - Uncomment to display user role */}
                    {/* <td><span className="role-badge">{getRoleLabel(user.role)}</span></td> */}
                    <td>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="delete-btn"
                        disabled={loading}
                        title="Delete user"
                      >
                        <Trash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
