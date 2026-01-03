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
        <Table hover responsive className="align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th style={{ minWidth: '150px' }}>Name</th>
              <th style={{ minWidth: '200px' }}>Email</th>
              <th style={{ minWidth: '180px' }}>Company</th>
              <th className="text-end" style={{ minWidth: '100px' }}>Actions</th>
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
      <Table hover responsive className="align-middle mb-0">
        <thead className="bg-light">
          <tr>
            <th style={{ minWidth: '150px' }}>Name</th>
            <th style={{ minWidth: '200px' }}>Email</th>
            <th style={{ minWidth: '180px' }}>Company</th>
            <th className="text-end" style={{ minWidth: '100px' }}>Actions</th>
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
