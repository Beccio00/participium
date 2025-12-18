import { Table, Badge } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import type { ExternalCompanyResponse } from '../../types';

interface CompaniesTableProps {
  companies: ExternalCompanyResponse[];
  onDelete: (companyId: number) => void;
}

export default function CompaniesTable({ companies, onDelete }: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th>Company Name</th>
              <th>Platform Access</th>
              <th>Categories</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center py-4 text-muted">
                No companies found.
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
            <th>Company Name</th>
            <th>Platform Access</th>
            <th>Categories</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td className="fw-bold">{company.name}</td>
              <td>
                {company.platformAccess ? (
                  <Badge bg="success">Enabled</Badge>
                ) : (
                  <Badge bg="secondary">No Access</Badge>
                )}
              </td>
              <td>
                <div className="d-flex flex-wrap gap-1">
                  {company.categories.map((cat, idx) => (
                    <Badge key={idx} bg="light" text="dark" className="border">
                      {String(cat).toLowerCase().replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="text-end">
                <button
                  onClick={() => onDelete(company.id)}
                  className="btn btn-sm btn-outline-danger border-0"
                  title="Delete Company"
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
