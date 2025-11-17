import { useState, useEffect } from "react";
import { Container, Table, Form, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import Card, { CardHeader, CardBody } from "../../components/ui/Card.tsx";
import { createMunicipalityUser, listMunicipalityUsers, deleteMunicipalityUser } from "../../api/api";
import type { MunicipalityUserRequest, MunicipalityUserResponse } from "../../types";
import { PersonPlus, Trash, People } from "react-bootstrap-icons";
import { MUNICIPALITY_ROLES, getRoleLabel } from "../../utils/roles";

const INITIAL_FORM_STATE: MunicipalityUserRequest = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "" as any,
};

export default function AdminPanel() {
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
    <div style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg)' }}>
      <Container className="py-4">
        <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0 fw-bold text-dark">
              <People className="me-2" /> Municipality Users
            </h2>
            <Button onClick={toggleForm} variant={showForm ? "secondary" : "primary"} disabled={isLoading}>
              {showForm ? "← Back" : <><PersonPlus className="me-2" /> Add New User</>}
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {showForm && (
            <form onSubmit={form.handleSubmit} className="mb-4">
              <div className="row g-3 mb-3">
                <div className="col-md-6">
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
                </div>

                <div className="col-md-6">
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
                className="mb-3"
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
                className="mb-3"
              />

              <Form.Group className="mb-4">
                <Form.Label htmlFor="role">Role</Form.Label>
                <Form.Select
                  id="role"
                  name="role"
                  value={form.values.role}
                  onChange={form.handleChange}
                  disabled={form.isSubmitting}
                  required
                >
                  <option value="">- Select a role -</option>
                  {MUNICIPALITY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button type="submit" variant="primary" fullWidth disabled={form.isSubmitting} isLoading={form.isSubmitting}>
                {form.isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </form>
          )}

          <div>
            <h3 className="mb-3 h4 fw-semibold text-dark">
              Registered Municipality Users ({users.length})
            </h3>

            {isLoading && users.length === 0 ? (
              <div className="text-center text-muted py-5">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-muted py-5">No municipality users yet</div>
            ) : (
              <Table striped responsive>
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
                        <Badge bg="secondary">{getRoleLabel(user.role)}</Badge>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-outline-danger"
                          disabled={isLoading}
                          title="Delete user"
                        >
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </CardBody>
      </Card>
    </Container>
    </div>
  );
}
