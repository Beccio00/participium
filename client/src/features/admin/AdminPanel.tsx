import { useState, useEffect } from "react";
import { Container, Alert, Badge, Nav } from 'react-bootstrap';
import { useAuth, useForm, useLoadingState } from "../../hooks";
import Button from "../../components/ui/Button.tsx";
import Card, { CardHeader, CardBody } from "../../components/ui/Card.tsx";
import ConfirmModal from "../../components/ui/ConfirmModal";
import AccessRestricted from "../../components/AccessRestricted";
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

// Helper: Check if user has admin role
function hasAdminRole(user: any, isAuthenticated: boolean): boolean {
  if (!isAuthenticated || !user) return false;
  
  const adminRole = Role.ADMINISTRATOR.toString();
  return user.role === adminRole || (Array.isArray(user.role) && user.role.includes(adminRole));
}

// Helper: Get item count for current tab
function getTabItemCount(tab: UserTab, internalCount: number, externalCount: number, companyCount: number): number {
  if (tab === 'internal') return internalCount;
  if (tab === 'external') return externalCount;
  return companyCount;
}

// Helper: Get nav link class names for active/inactive states
const getActiveNavLinkClass = (): string => 'fw-bold text-dark';
const getInactiveNavLinkClass = (): string => 'text-muted';

export default function AdminPanel() {
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
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = hasAdminRole(user, isAuthenticated);

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
          // UPDATE: modifica solo i ruoli
          await updateMunicipalityUser(editingUser.id, {
            roles: values.role,
          });
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

  // Initialize form hook unconditionally at the top level
  const form = useForm<UnifiedFormState>({
    initialValues: INITIAL_FORM_STATE,
    onSubmit: handleCreateOrUpdate,
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Check access before rendering
  if (!isAdmin) {
    const message = !isAuthenticated
      ? "You need to be logged in as an administrator to access this page."
      : "Only administrators can access the admin panel.";
    
    return <AccessRestricted message={message} showLoginButton={!isAuthenticated} />;
  }

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

  const handleDeleteClick = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete === null) return;

    try {
      setIsDeleting(true);
      setError("");
      await deleteByTab(userToDelete);
      await loadData();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setEditingUser(null);
      form.resetForm();
      setError("");
    }
  };

  // Helper: Normalize user role to array format
  const normalizeUserRole = (role: any): MunicipalityUserRoles[] => {
    if (Array.isArray(role)) return role;
    if (role) return [role];
    return [];
  };

  const handleEdit = (user: MunicipalityUserResponse) => {
    setEditingUser(user);
    setShowForm(true);
    form.setValues({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Vuoto per sicurezza
      role: normalizeUserRole(user.role),
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
            variant={showForm ? "secondary" : "primary"} 
            disabled={isLoading}
          >
            {showForm ? "← Back" : <><PersonPlus className="me-2" /> Add {addButtonLabel}</>}
          </Button>
        </div>

        {/* Navigation tabs */}
        <Nav variant="tabs" className="mb-3 flex-wrap" activeKey={activeTab} style={{ overflowX: 'auto', minHeight: '50px' }}>
          <Nav.Item style={{ minWidth: '200px' }}>
            <Nav.Link 
              eventKey="internal" 
              onClick={() => handleTabChange('internal')}
              className={activeTab === 'internal' ? getActiveNavLinkClass() : getInactiveNavLinkClass()}
              style={{ whiteSpace: 'nowrap' }}
            >
              <People className="me-2" /> Internal Staff
            </Nav.Link>
          </Nav.Item>
          <Nav.Item style={{ minWidth: '200px' }}>
            <Nav.Link 
              eventKey="external" 
              onClick={() => handleTabChange('external')}
              className={activeTab === 'external' ? getActiveNavLinkClass() : getInactiveNavLinkClass()}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Briefcase className="me-2" /> External Maintainers
            </Nav.Link>
          </Nav.Item>
          <Nav.Item style={{ minWidth: '180px' }}>
            <Nav.Link 
              eventKey="companies" 
              onClick={() => handleTabChange('companies')}
              className={activeTab === 'companies' ? getActiveNavLinkClass() : getInactiveNavLinkClass()}
              style={{ whiteSpace: 'nowrap' }}
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
                {getTabItemCount(activeTab, internalUsers.length, externalUsers.length, companies.length)} items
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
                {activeTab === 'companies' && (
                  <CompanyForm
                    values={form.values}
                    isSubmitting={form.isSubmitting}
                    availableCategories={AVAILABLE_CATEGORIES}
                    onChange={form.handleChange}
                    onCategoryToggle={handleCategoryToggle}
                    onPlatformAccessChange={(value) => form.setFieldValue('platformAccess', value)}
                    onSubmit={form.handleSubmit}
                  />
                )}
                {activeTab !== 'companies' && (
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
                    isEditing={!!editingUser}
                    editingUser={editingUser}
                    companies={companies}
                    onChange={form.handleChange}
                    onSubmit={form.handleSubmit}
                  />
                )}
              </div>
            )}

            {activeTab === 'internal' && (
              <InternalStaffTable users={internalUsers} onDelete={handleDeleteClick} onEdit={handleEdit} />
            )}
            
            {activeTab === 'external' && (
              <ExternalMaintainersTable users={externalUsers} onDelete={handleDeleteClick} />
            )}

            {activeTab === 'companies' && (
              <CompaniesTable companies={companies} onDelete={handleDeleteClick} />
            )}
            
          </CardBody>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Confirmation"
        message={activeTab === 'companies' 
          ? "Are you sure you want to delete this company? This action cannot be undone."
          : "Are you sure you want to delete this user? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}