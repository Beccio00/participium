import { useCallback } from 'react';
import { Trash, Building } from 'react-bootstrap-icons';
import DataTable, { type Column } from '../../components/ui/DataTable';
import type { ExternalMaintainerResponse } from '../../types';

interface ExternalMaintainersTableProps {
  users: ExternalMaintainerResponse[];
  onDelete: (userId: number) => void;
}

// Name display component
function NameDisplay({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <span className="fw-medium">
      {firstName} {lastName}
    </span>
  );
}

// Company display component
function CompanyDisplay({ company }: { company?: { name: string } }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <Building size={14} className="text-muted" />
      <span className="fw-semibold text-dark">
        {company?.name || "Unknown Company"}
      </span>
    </div>
  );
}

// Delete button component
function DeleteButton({ userId, onDelete }: { userId: number; onDelete: (id: number) => void }) {
  return (
    <button
      onClick={() => onDelete(userId)}
      className="btn btn-sm btn-outline-danger border-0"
      title="Delete External Maintainer"
    >
      <Trash />
    </button>
  );
}

// Column definitions
const columns: Column<ExternalMaintainerResponse>[] = [
  {
    key: 'name',
    header: 'Name',
    minWidth: '150px',
    render: (user) => <NameDisplay firstName={user.firstName} lastName={user.lastName} />,
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
    render: (user) => <CompanyDisplay company={user.company} />,
  },
];

export default function ExternalMaintainersTable({ users, onDelete }: ExternalMaintainersTableProps) {
  const renderActions = useCallback(
    (user: ExternalMaintainerResponse) => <DeleteButton userId={user.id} onDelete={onDelete} />,
    [onDelete]
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No external maintainers found."
      actions={renderActions}
    />
  );
}
