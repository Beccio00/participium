import { useState, useEffect } from "react";
import { Container, Table, Form, Alert, Badge, Nav } from 'react-bootstrap';
import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import Card, { CardHeader, CardBody } from "../../components/ui/Card.tsx";
import { 
  createMunicipalityUser, 
  listMunicipalityUsers, 
  deleteMunicipalityUser,
  createExternalMaintainer,
  getExternalMaintainers,
  getExternalCompanies,
  deleteExternalMaintainer,
  getExternalCompaniesWithAccess
} from "../../api/api";
import type { 
  MunicipalityUserRequest, 
  MunicipalityUserResponse 
} from "../../types";
import type {
  ExternalMaintainerResponse,
  ExternalCompanyResponse,
  CreateExternalMaintainerData
} from "../../types"; 
import { PersonPlus, Trash, People, Briefcase, Building } from "react-bootstrap-icons";
import { MUNICIPALITY_ROLES, getRoleLabel } from "../../utils/roles";

interface UnifiedFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; 
  externalCompanyId: string;
}

const INITIAL_FORM_STATE: UnifiedFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "",
  externalCompanyId: "",
};

type UserTab = 'internal' | 'external';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  //data States
  const [internalUsers, setInternalUsers] = useState<MunicipalityUserResponse[]>([]);
  const [externalUsers, setExternalUsers] = useState<ExternalMaintainerResponse[]>([]);
  const [companies, setCompanies] = useState<ExternalCompanyResponse[]>([]);
  
  //ui States
  const [activeTab, setActiveTab] = useState<UserTab>('internal');
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { loadingState, setLoading, setIdle } = useLoadingState();

  const isAdmin = isAuthenticated && user?.role === "ADMINISTRATOR";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading();
      setError("");
      
      const [mUsers, eUsers, comps] = await Promise.all([
        listMunicipalityUsers(),
        getExternalMaintainers(),
        getExternalCompaniesWithAccess()
      ]);

      setInternalUsers(mUsers);
      setExternalUsers(eUsers);
      setCompanies(comps);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIdle();
    }
  };

  const handleCreate = async (values: UnifiedFormState) => {
    try {
      if (activeTab === 'internal') {
        const payload: MunicipalityUserRequest = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role as any,
        };
        await createMunicipalityUser(payload);
      } else {
        const payload: CreateExternalMaintainerData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          externalCompanyId: values.externalCompanyId,
        };
        await createExternalMaintainer(payload);
      }

      form.resetForm();
      setShowForm(false);
      await loadData(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      throw err;
    }
  };

  const form = useForm<UnifiedFormState>({
    initialValues: INITIAL_FORM_STATE,
    onSubmit: handleCreate,
  });

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading();
      setError("");
      
      if (activeTab === 'internal') {
        await deleteMunicipalityUser(userId);
      } else {
        await deleteExternalMaintainer(userId);
      }
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIdle();
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      form.resetForm();
      setError("");
    }
  };

  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
    setShowForm(false);
    setError("");
    form.resetForm();
  };

  const isLoading = loadingState === "loading";

  const tabColor = activeTab === 'internal' ? 'var(--primary)' : '#fd7e14'; 
  const tabTitle = activeTab === 'internal' ? 'Municipality Staff' : 'External Maintainers';
  const TabIcon = activeTab === 'internal' ? People : Briefcase;

  return (
    <div style={{ paddingTop: '10px', minHeight: '100vh', background: 'var(--bg)' }}>
      <Container className="py-4">
        
        {/* Header section */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark">User Management</h2>
            <p className="text-muted mb-0">Manage internal staff and external contractors access.</p>
          </div>
          <Button 
            onClick={toggleForm} 
            variant={showForm ? "secondary" :  "primary" } 
            disabled={isLoading}
          >
            {showForm ? "← Back" : <><PersonPlus className="me-2" /> Add {activeTab === 'internal' ? 'Staff' : 'External'}</>}
          </Button>
        </div>

        {/* Navigation tabs */}
        <Nav variant="tabs" className="mb-3" activeKey={activeTab}>
          <Nav.Item>
            <Nav.Link 
              eventKey="internal" 
              onClick={() => handleTabChange('internal')}
              className={activeTab === 'internal' ? 'fw-bold' : ''}
            >
              <People className="me-2" /> Internal Staff
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="external" 
              onClick={() => handleTabChange('external')}
              className={activeTab === 'external' ? 'fw-bold text-dark' : 'text-muted'}
            >
              <Briefcase className="me-2" /> External Contractors
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Card>
          <CardHeader className="py-3 bg-white border-bottom">
            <div className="d-flex align-items-center gap-2">
              <TabIcon size={24} style={{ color: tabColor }} />
              <h5 className="mb-0 fw-bold">{tabTitle}</h5>
              <Badge bg="light" text="dark" className="border ms-2">
                {activeTab === 'internal' ? internalUsers.length : externalUsers.length} users
              </Badge>
            </div>
          </CardHeader>

          <CardBody>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Creation form */}
            {showForm && (
              <div className="mb-5 p-4 rounded bg-light border">
                <h5 className="mb-3 pb-2 border-bottom">Create New {activeTab === 'internal' ? 'Municipality User' : 'External Maintainer'}</h5>
                <form onSubmit={form.handleSubmit}>
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
                        placeholder="e.g. Mario"
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
                        placeholder="e.g. Rossi"
                      />
                    </div>
                  </div>

                  <Input
                    type="email"
                    id="email"
                    name="email"
                    label="Email Address"
                    value={form.values.email}
                    onChange={form.handleChange}
                    disabled={form.isSubmitting}
                    required
                    className="mb-3"
                    placeholder="name@example.com"
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
                    placeholder="Min. 8 characters"
                  />

                  {/* Different fields based on active tab */}
                  {activeTab === 'internal' ? (
                    <Form.Group className="mb-4">
                      <Form.Label htmlFor="role" className="fw-semibold">Assigned Role</Form.Label>
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
                      <Form.Text className="text-muted">
                        Defines permissions within the administrative panel.
                      </Form.Text>
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-4">
                      <Form.Label htmlFor="externalCompanyId" className="fw-semibold">Associated Company</Form.Label>
                      <Form.Select
                        id="externalCompanyId"
                        name="externalCompanyId"
                        value={form.values.externalCompanyId}
                        onChange={form.handleChange}
                        disabled={form.isSubmitting}
                        required
                      >
                        <option value="">- Select a company -</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        This user will receive reports assigned to this company.
                      </Form.Text>
                    </Form.Group>
                  )}

                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      type="submit" 
                      variant={"primary"} 
                      disabled={form.isSubmitting} 
                      isLoading={form.isSubmitting}
                    >
                      {form.isSubmitting ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Lists of users */}
            {activeTab === 'internal' ? (
              //Internal users list (municipality)
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalUsers.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-4 text-muted">No municipality users found.</td></tr>
                    ) : internalUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-medium">{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td><Badge bg="primary" >{getRoleLabel(u.role)}</Badge></td>
                        <td className="text-end">
                          <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-outline-danger border-0">
                            <Trash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              // External users list (external maintainers)
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalUsers.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-4 text-muted">No external maintainers found.</td></tr>
                    ) : externalUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-medium">{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Building size={14} className="text-muted" />
                            <span className="fw-semibold text-dark">{u.company?.name|| "Unknown Company"}</span>
                          </div>
                        </td>
                        <td className="text-end">
                          <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-outline-danger border-0">
                            <Trash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}