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

export default function InternalStaffTable({
  users,
  onDelete,
  onEdit,
}: InternalStaffTableProps) {
  const columns: Column<MunicipalityUserResponse>[] = [
    {
      key: "name",
      header: "Name",
      minWidth: "150px",
      render: (user) => (
        <span className="fw-medium">
          {user.firstName} {user.lastName}
        </span>
      ),
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
      render: (user) => (
        <>
          {user.role.map((role) => (
            <Badge key={role} bg="primary" className="me-1">
              {getRoleLabel(role)}
            </Badge>
          ))}
        </>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No staff found."
      actions={(user) => (
        <>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => onEdit(user)}
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
      )}
    />
  );
}