import { Badge } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import DataTable, { type Column } from '../../components/ui/DataTable';
import type { ExternalCompanyResponse } from '../../types';

interface CompaniesTableProps {
  companies: ExternalCompanyResponse[];
  onDelete: (companyId: number) => void;
}

export default function CompaniesTable({ companies, onDelete }: CompaniesTableProps) {
  const columns: Column<ExternalCompanyResponse>[] = [
    {
      key: 'name',
      header: 'Company Name',
      minWidth: '180px',
      render: (company) => <span className="fw-bold">{company.name}</span>,
    },
    {
      key: 'platformAccess',
      header: 'Platform Access',
      minWidth: '140px',
      render: (company) =>
        company.platformAccess ? (
          <Badge bg="success">Enabled</Badge>
        ) : (
          <Badge bg="secondary">No Access</Badge>
        ),
    },
    {
      key: 'categories',
      header: 'Categories',
      minWidth: '200px',
      render: (company) => (
        <div className="d-flex flex-wrap gap-1">
          {company.categories.map((cat, idx) => (
            <Badge key={idx} bg="light" text="dark" className="border">
              {String(cat).toLowerCase().replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={companies}
      columns={columns}
      keyExtractor={(company) => company.id}
      emptyMessage="No companies found."
      actions={(company) => (
        <button
          onClick={() => onDelete(company.id)}
          className="btn btn-sm btn-outline-danger border-0"
          title="Delete Company"
        >
          <Trash />
        </button>
      )}
    />
  );
}
