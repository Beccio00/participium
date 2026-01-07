import { Table } from "react-bootstrap";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  minWidth?: string;
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  actions?: (item: T) => ReactNode;
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data found.",
  actions,
}: DataTableProps<T>) {
  const allColumns = actions
    ? [
        ...columns,
        {
          key: "actions",
          header: "Actions",
          minWidth: "100px",
          className: "text-end",
          render: actions,
        },
      ]
    : columns;

  if (data.length === 0) {
    return (
      <div className="table-responsive">
        <Table hover responsive className="align-middle mb-0">
          <thead className="bg-light">
            <tr>
              {allColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.minWidth }}
                  className={col.className}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={allColumns.length} className="text-center py-4 text-muted">
                {emptyMessage}
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
            {allColumns.map((col) => (
              <th
                key={col.key}
                style={{ minWidth: col.minWidth }}
                className={col.className}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {allColumns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
