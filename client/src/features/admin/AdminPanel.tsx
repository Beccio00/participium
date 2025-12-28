import { useState, useEffect } from "react";
import { Container, Alert, Badge, Nav } from 'react-bootstrap';
import { useNavigate } from "react-router";
import { useAuth, useForm, useLoadingState } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Card, { CardHeader, CardBody } from "../../components/ui/Card.tsx";
import InternalStaffTable from './InternalStaffTable';
import ExternalMaintainersTable from './ExternalMaintainersTable';
import CompaniesTable from './CompaniesTable';
import UserForm from './UserForm';
import CompanyForm from './CompanyForm';
import { 
  createMunicipalityUser, 
  listMunicipalityUsers, 
  deleteMunicipalityUser,
  updateMunicipalityUser,
  updateMunicipalityUserRoles,
  createExternalMaintainer,
  getExternalMaintainers,
  getExternalCompanies,
  createExternalCompany,
  deleteExternalCompany,
  deleteExternalMaintainer
} from "../../api/api";
import type { 
  MunicipalityUserRequest, 
  MunicipalityUserResponse 
} from "../../types";
import type { MunicipalityUserRoles } from "../../../../shared/MunicipalityUserTypes";
import type {
  ExternalMaintainerResponse,
  ExternalCompanyResponse,
  CreateExternalMaintainerData,
  CreateExternalCompanyData,
  ReportCategory
} from "../../types"; 
import { Role } from "../../../../shared/RoleTypes";
import { PersonPlus, People, Briefcase, Building } from "react-bootstrap-icons";

interface UnifiedFormState {
  //for users (both internal and external)
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: MunicipalityUserRoles[];
  externalCompanyId: string;

  //for external companies
  companyName: string;
  platformAccess: boolean;
  categories: ReportCategory[];
}

const INITIAL_FORM_STATE: UnifiedFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: [],
  externalCompanyId: "",

  companyName: "",
  platformAccess: false,
  categories: [],
};
const AVAILABLE_CATEGORIES: ReportCategory[] = [
  "WATER_SUPPLY_DRINKING_WATER",
  "ARCHITECTURAL_BARRIERS",
  "SEWER_SYSTEM",
  "PUBLIC_LIGHTING",
  "WASTE",
  "ROAD_SIGNS_TRAFFIC_LIGHTS",
  "ROADS_URBAN_FURNISHINGS",
  "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
  "OTHER"
] as any[];

type UserTab = 'internal' | 'external' | 'companies';

interface TabConfig {
  color: string;
  title: string;
  icon: typeof People;
  addButtonLabel: string;
}

function getTabConfiguration(tab: UserTab): TabConfig {
  if (tab === 'external') {
    return {
      color: 'var(--primary)',
      title: 'External Maintainers',
      icon: Briefcase,
      addButtonLabel: 'Maintainer',
    };
  }
  if (tab === 'companies') {
    return {
      color: 'var(--primary)',
      title: 'External Companies',
      icon: Building,
      addButtonLabel: 'Company',
    };
  }
  return {
    color: 'var(--primary)',
    title: 'Municipality Staff',
    icon: People,
    addButtonLabel: 'Staff',
  };
}

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
  const [editingUser, setEditingUser] = useState<MunicipalityUserResponse | null>(null);
  const { loadingState, setLoading, setIdle } = useLoadingState();

  const isAdmin =
    isAuthenticated &&
    (user?.role === Role.ADMINISTRATOR.toString() ||
      (Array.isArray(user?.role) && user.role.includes(Role.ADMINISTRATOR.toString())));

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "ADMINISTRATOR" ||
        (Array.isArray(user?.role) && user.role.includes("ADMINISTRATOR")))
    ) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    try {
      setLoading();
      setError("");
      
      const [mUsers, eUsers, comps] = await Promise.all([
        listMunicipalityUsers(),
        getExternalMaintainers(),
        getExternalCompanies()
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

  const createInternalUser = async (values: UnifiedFormState) => {
    const payload: MunicipalityUserRequest = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
    };
    await createMunicipalityUser(payload);
  };

  const createExternalUser = async (values: UnifiedFormState) => {
    const payload: CreateExternalMaintainerData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      externalCompanyId: values.externalCompanyId,
    };
    await createExternalMaintainer(payload);
  };

  const createCompany = async (values: UnifiedFormState) => {
    const payload: CreateExternalCompanyData = {
      name: values.companyName,
      categories: values.categories,
      platformAccess: values.platformAccess,
    };
    await createExternalCompany(payload);
  };

  const handleCreateOrUpdate = async (values: UnifiedFormState) => {
    try {
      if (activeTab === 'internal') {
        if (editingUser) {
          // UPDATE: aggiorna i dati base e i ruoli separatamente
          await updateMunicipalityUser(editingUser.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            role: values.role,
          });
          await updateMunicipalityUserRoles(editingUser.id, values.role);
        } else {
          // CREATE
          await createInternalUser(values);
        }
      } else if (activeTab === 'external') {
        await createExternalUser(values);
      } else {
        await createCompany(values);
      }

      setEditingUser(null);
      form.resetForm();
      form.setFieldValue('categories', []);
      form.setFieldValue('platformAccess', false);
      setShowForm(false);
      await loadData(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
      throw err;
    }
  };

  const form = useForm<UnifiedFormState>({
    initialValues: INITIAL_FORM_STATE,
    onSubmit: handleCreateOrUpdate,
  });

  const handleCategoryToggle = (category: ReportCategory) => {
    const currentCategories = form.values.categories;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    form.setFieldValue('categories', newCategories);
  };

  const deleteByTab = async (userId: number) => {
    if (activeTab === 'internal') {
      await deleteMunicipalityUser(userId);
    } else if (activeTab === 'external') {
      await deleteExternalMaintainer(userId);
    } else {
      await deleteExternalCompany(userId);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading();
      setError("");
      await deleteByTab(userId);
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
      setEditingUser(null);
      form.resetForm();
      setError("");
    }
  };

  const handleEdit = (user: MunicipalityUserResponse) => {
    setEditingUser(user);
    setShowForm(true);
    form.setValues({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Vuoto per sicurezza
      role: Array.isArray(user.role) ? user.role : user.role ? [user.role] : [],
      externalCompanyId: "",
      companyName: "",
      platformAccess: false,
      categories: [],
    });
  };

  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
    setShowForm(false);
    setError("");
    form.resetForm();
  };

  const isLoading = loadingState === "loading";

  const tabConfig = getTabConfiguration(activeTab);
  const { color: tabColor, title: tabTitle, icon: TabIcon, addButtonLabel } = tabConfig;

  return (
    <div style={{ paddingTop: '10px', minHeight: '100vh', background: 'var(--bg)' }}>
      <Container className="py-4">
        
        {/* Header section */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark">User and Companies Management</h2>
            <p className="text-muted mb-0">Manage internal staff, external contractors and partner companies access.</p>
          </div>
          <Button 
            onClick={toggleForm} 
            variant={showForm ? "secondary" :  "primary" } 
            disabled={isLoading}
          >
            {showForm ? "← Back" : <><PersonPlus className="me-2" /> Add {addButtonLabel}</>}
          </Button>
        </div>

        {/* Navigation tabs */}
        <Nav variant="tabs" className="mb-3" activeKey={activeTab}>
          <Nav.Item>
            <Nav.Link 
              eventKey="internal" 
              onClick={() => handleTabChange('internal')}
              className={activeTab === 'internal' ? 'fw-bold text-dark' : 'text-muted'}
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
              <Briefcase className="me-2" /> External Maintainers
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="companies" 
              onClick={() => handleTabChange('companies')}
              className={activeTab === 'companies' ? 'fw-bold text-dark' : 'text-muted'}
            >
              <Building className="me-2" /> Partner Companies
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Card>
          <CardHeader className="py-3 bg-white border-bottom">
            <div className="d-flex align-items-center gap-2">
              <TabIcon size={24} style={{ color: tabColor }} />
              <h5 className="mb-0 fw-bold">{tabTitle}</h5>
              <Badge bg="light" text="dark" className="border ms-2">
                {activeTab === 'internal' ? internalUsers.length : 
                activeTab === 'external' ? externalUsers.length : companies.length} items
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
                <h5 className="mb-3 pb-2 border-bottom">{editingUser ? "Edit Staff" : `Create New ${addButtonLabel}`}</h5>
                {activeTab === 'companies' ? (
                  <CompanyForm
                    values={form.values}
                    isSubmitting={form.isSubmitting}
                    availableCategories={AVAILABLE_CATEGORIES}
                    onChange={form.handleChange}
                    onCategoryToggle={handleCategoryToggle}
                    onPlatformAccessChange={(value) => form.setFieldValue('platformAccess', value)}
                    onSubmit={form.handleSubmit}
                  />
                ) : (
                  <UserForm
                    values={{
                      firstName: form.values.firstName,
                      lastName: form.values.lastName,
                      email: form.values.email,
                      password: form.values.password,
                      role: form.values.role,
                      externalCompanyId: form.values.externalCompanyId,
                    }}
                    isSubmitting={form.isSubmitting}
                    isInternal={activeTab === 'internal'}
                    companies={companies}
                    onChange={form.handleChange}
                    onSubmit={form.handleSubmit}
                  />
                )}
              </div>
            )}

            {activeTab === 'internal' && (
              <InternalStaffTable users={internalUsers} onDelete={handleDelete} onEdit={handleEdit} />
            )}
            
            {activeTab === 'external' && (
              <ExternalMaintainersTable users={externalUsers} onDelete={handleDelete} />
            )}

            {activeTab === 'companies' && (
              <CompaniesTable companies={companies} onDelete={handleDelete} />
            )}
            
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}