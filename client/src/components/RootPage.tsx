import { useAuth } from "../hooks/useAuth";
import HomePage from "../features/reports/HomePage";
import AdminPanel from "../features/admin/AdminPanel";
import { Role } from "../../../shared/RoleTypes";
import { userHasRole } from "../utils/roles";

export default function RootPage() {
  const { user, isAuthenticated } = useAuth();

  // If authenticated as administrator, show AdminPanel
  if (isAuthenticated && user && userHasRole(user, Role.ADMINISTRATOR)) {
    return <AdminPanel />;
  }

  // Otherwise show HomePage
  return <HomePage />;
}
