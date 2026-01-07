import { Badge } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import DataTable, { type Column } from '../../components/ui/DataTable';
import type { ExternalCompanyResponse } from '../../types';

interface CompaniesTableProps {
  companies: ExternalCompanyResponse[];
  onDelete: (companyId: number) => void;
}

// Nested component: Platform access badge
function PlatformAccessBadge({ platformAccess }: { platformAccess: boolean }) {
  return platformAccess ? (
    <Badge bg="success">Enabled</Badge>
  ) : (
    <Badge bg="secondary">No Access</Badge>
  );
}

// Nested component: Categories display
function CategoriesList({ categories }: { categories: string[] }) {
  return (
    <div className="d-flex flex-wrap gap-1">
      {categories.map((cat, idx) => (
        <Badge key={idx} bg="light" text="dark" className="border">
          {String(cat).toLowerCase().replace(/_/g, ' ')}
        </Badge>
      ))}
    </div>
  );
}

// Column definitions
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
    render: (company) => <PlatformAccessBadge platformAccess={company.platformAccess} />,
  },
  {
    key: 'categories',
    header: 'Categories',
    minWidth: '200px',
    render: (company) => <CategoriesList categories={company.categories} />,
  },
];

// Delete button component
function DeleteButton({ companyId, onDelete }: { companyId: number; onDelete: (id: number) => void }) {
  return (
    <button
      onClick={() => onDelete(companyId)}
      className="btn btn-sm btn-outline-danger border-0"
      title="Delete Company"
    >
      <Trash />
    </button>
  );
}

export default function CompaniesTable({ companies, onDelete }: CompaniesTableProps) {
  return (
    <DataTable
      data={companies}
      columns={columns}
      keyExtractor={(company) => company.id}
      emptyMessage="No companies found."
      actions={(company) => <DeleteButton companyId={company.id} onDelete={onDelete} />}
    />
  );
}
