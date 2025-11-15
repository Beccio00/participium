import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import { Button, Input, Card, CardHeader, CardBody } from "../../components/ui";
import { createMunicipalityUser, listMunicipalityUsers, deleteMunicipalityUser } from "../../api/api";
import type { MunicipalityUserRequest, MunicipalityUserResponse } from "../../types";
import { PersonPlus, Trash, People } from "react-bootstrap-icons";
import { MUNICIPALITY_ROLES, getRoleLabel } from "../../utils/roles";
import "./AdminPanel.css";

const INITIAL_FORM_STATE: MunicipalityUserRequest = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "PUBLIC_RELATIONS",
};

export function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<MunicipalityUserResponse[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { loadingState, setLoading, setIdle } = useLoadingState();

  const isAdmin = isAuthenticated && user?.role === "ADMINISTRATOR";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading();
      setError("");
      const data = await listMunicipalityUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIdle();
    }
  };

  const handleCreateUser = async (values: MunicipalityUserRequest) => {
    try {
      await createMunicipalityUser(values);
      form.resetForm();
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      throw err;
    }
  };

  const form = useForm<MunicipalityUserRequest>({
    initialValues: INITIAL_FORM_STATE,
    onSubmit: handleCreateUser,
  });

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading();
      setError("");
      await deleteMunicipalityUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIdle();
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) {
      form.resetForm();
      setError("");
    }
  };

  const isLoading = loadingState === "loading";

  return (
    <div className="admin-panel-container">
      <Card className="admin-panel-card">
        <CardHeader>
          <div className="admin-header">
            <h2>
              <People /> Municipality Users
            </h2>
            <Button onClick={toggleForm} variant={showForm ? "secondary" : "primary"} disabled={isLoading}>
              {showForm ? "← Back" : <><PersonPlus /> Add New User</>}
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {error && <div className="error-message">{error}</div>}

          {showForm && (
            <form onSubmit={form.handleSubmit} className="user-form">
              <div className="form-row">
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={form.values.firstName}
                  onChange={form.handleChange}
                  disabled={form.isSubmitting}
                  required
                />

                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={form.values.lastName}
                  onChange={form.handleChange}
                  disabled={form.isSubmitting}
                  required
                />
              </div>

              <Input
                type="email"
                id="email"
                name="email"
                label="Email"
                value={form.values.email}
                onChange={form.handleChange}
                disabled={form.isSubmitting}
                required
              />

              <Input
                type="password"
                id="password"
                name="password"
                label="Password"
                value={form.values.password}
                onChange={form.handleChange}
                disabled={form.isSubmitting}
                minLength={8}
                required
              />

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.values.role}
                  onChange={form.handleChange}
                  disabled={form.isSubmitting}
                  required
                  className="form-select"
                >
                  {MUNICIPALITY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="primary" fullWidth disabled={form.isSubmitting} isLoading={form.isSubmitting}>
                {form.isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </form>
          )}

          <div className="users-list">
            <h3>Registered Municipality Users ({users.length})</h3>

            {isLoading && users.length === 0 ? (
              <div className="loading-message">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-message">No municipality users yet</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="role-badge">{getRoleLabel(user.role)}</span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(user.id)} className="delete-btn" disabled={isLoading} title="Delete user">
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
