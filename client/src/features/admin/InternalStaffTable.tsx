import { Badge } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import DataTable, { type Column } from "../../components/ui/DataTable";
import type { MunicipalityUserResponse } from "../../types";
import { getRoleLabel } from "../../utils/roles";

interface InternalStaffTableProps {
  users: MunicipalityUserResponse[];
  onDelete: (userId: number) => void;
  onEdit: (user: MunicipalityUserResponse) => void;
}

// Name display component
function NameDisplay({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <span className="fw-medium">
      {firstName} {lastName}
    </span>
  );
}

// Roles display component
function RolesBadges({ roles }: { roles: string[] }) {
  return (
    <>
      {roles.map((role) => (
        <Badge key={role} bg="primary" className="me-1">
          {getRoleLabel(role)}
        </Badge>
      ))}
    </>
  );
}

// Action buttons component
function ActionButtons({
  user,
  onEdit,
  onDelete,
}: {
  user: MunicipalityUserResponse;
  onEdit: (user: MunicipalityUserResponse) => void;
  onDelete: (userId: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary me-2"
        onClick={() => onEdit(user)}
        title="Edit user"
      >
        Edit
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger border-0"
        onClick={() => onDelete(user.id)}
        aria-label="Delete user"
      >
        <Trash />
      </button>
    </>
  );
}

// Column definitions
const columns: Column<MunicipalityUserResponse>[] = [
  {
    key: "name",
    header: "Name",
    minWidth: "150px",
    render: (user) => <NameDisplay firstName={user.firstName} lastName={user.lastName} />,
  },
  {
    key: "email",
    header: "Email",
    minWidth: "200px",
    render: (user) => user.email,
  },
  {
    key: "roles",
    header: "Roles",
    minWidth: "150px",
    render: (user) => <RolesBadges roles={user.role} />,
  },
];

export default function InternalStaffTable({
  users,
  onDelete,
  onEdit,
}: InternalStaffTableProps) {
  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No staff found."
      actions={(user) => <ActionButtons user={user} onEdit={onEdit} onDelete={onDelete} />}
    />
  );
}