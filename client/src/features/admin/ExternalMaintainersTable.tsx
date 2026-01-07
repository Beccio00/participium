import { Trash, Building } from 'react-bootstrap-icons';
import DataTable, { type Column } from '../../components/ui/DataTable';
import type { ExternalMaintainerResponse } from '../../types';

interface ExternalMaintainersTableProps {
  users: ExternalMaintainerResponse[];
  onDelete: (userId: number) => void;
}

export default function ExternalMaintainersTable({ users, onDelete }: ExternalMaintainersTableProps) {
  const columns: Column<ExternalMaintainerResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      minWidth: '150px',
      render: (user) => (
        <span className="fw-medium">
          {user.firstName} {user.lastName}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      minWidth: '200px',
      render: (user) => user.email,
    },
    {
      key: 'company',
      header: 'Company',
      minWidth: '180px',
      render: (user) => (
        <div className="d-flex align-items-center gap-2">
          <Building size={14} className="text-muted" />
          <span className="fw-semibold text-dark">
            {user.company?.name || "Unknown Company"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No external maintainers found."
      actions={(user) => (
        <button
          onClick={() => onDelete(user.id)}
          className="btn btn-sm btn-outline-danger border-0"
        >
          <Trash />
        </button>
      )}
    />
  );
}
