import { Table, Badge } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import type { MunicipalityUserResponse } from '../../types';
import { getRoleLabel } from '../../utils/roles';


interface InternalStaffTableProps {
  users: MunicipalityUserResponse[];
  onDelete: (userId: number) => void;
  onEdit: (user: MunicipalityUserResponse) => void;
}

export default function InternalStaffTable({ users, onDelete, onEdit }: InternalStaffTableProps) {
  if (users.length === 0) {
    return (
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
            <tr>
              <td colSpan={4} className="text-center py-4 text-muted">
                No staff found.
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
            <th>Role</th>
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
                {Array.isArray(user.role)
                  ? user.role.map((r) => (
                      <Badge key={r} bg="primary" className="me-1">{getRoleLabel(r)}</Badge>
                    ))
                  : <Badge bg="primary">{getRoleLabel(user.role)}</Badge>}
              </td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(user)}
                >
                  Edit
                </button>
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
