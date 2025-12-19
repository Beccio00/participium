import { Table } from 'react-bootstrap';
import { Trash, Building } from 'react-bootstrap-icons';
import type { ExternalMaintainerResponse } from '../../types';

interface ExternalMaintainersTableProps {
  users: ExternalMaintainerResponse[];
  onDelete: (userId: number) => void;
}

export default function ExternalMaintainersTable({ users, onDelete }: ExternalMaintainersTableProps) {
  if (users.length === 0) {
    return (
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
            <tr>
              <td colSpan={4} className="text-center py-4 text-muted">
                No external maintainers found.
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  }

  return (
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
          {users.map((user) => (
            <tr key={user.id}>
              <td className="fw-medium">
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Building size={14} className="text-muted" />
                  <span className="fw-semibold text-dark">
                    {user.company?.name || "Unknown Company"}
                  </span>
                </div>
              </td>
              <td className="text-end">
                <button
                  onClick={() => onDelete(user.id)}
                  className="btn btn-sm btn-outline-danger border-0"
                >
                  <Trash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
