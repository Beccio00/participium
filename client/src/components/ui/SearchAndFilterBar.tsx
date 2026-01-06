import { Row, Col, InputGroup, Form } from "react-bootstrap";
import { Search, FunnelFill } from "react-bootstrap-icons";

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  availableStatuses: string[];
  availableCategories: string[];
  lockedStatus?: string;
  compact?: boolean;
}

export default function SearchAndFilterBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterCategory,
  onCategoryChange,
  availableStatuses,
  availableCategories,
  lockedStatus,
  compact = false,
}: SearchAndFilterBarProps) {
  if (compact) {
    // Compact version for sidebar
    return (
      <div className="mb-2">
        <Row className="g-2">
          <Col md={12}>
            <InputGroup size="sm">
              <InputGroup.Text style={{ padding: '0.25rem 0.5rem' }}>
                <Search size={14} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              />
            </InputGroup>
          </Col>
          <Col md={6}>
            <InputGroup size="sm">
              <InputGroup.Text style={{ padding: '0.25rem 0.5rem' }}>
                <FunnelFill size={12} />
              </InputGroup.Text>
              <Form.Select
                value={lockedStatus || filterStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={!!lockedStatus}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                <option value="">All Statuses</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </InputGroup>
          </Col>
          <Col md={6}>
            <InputGroup size="sm">
              <InputGroup.Text style={{ padding: '0.25rem 0.5rem' }}>
                <FunnelFill size={12} />
              </InputGroup.Text>
              <Form.Select
                value={filterCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </InputGroup>
          </Col>
        </Row>
      </div>
    );
  }

  // Regular version for TechPanel and MyReportsPage
  return (
    <div className="mb-3" style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
      <Row className="g-3">
        <Col md={12}>
          <InputGroup>
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by report title..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FunnelFill size={14} />
            </InputGroup.Text>
            <Form.Select
              value={lockedStatus || filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={!!lockedStatus}
            >
              <option value="">All Statuses</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FunnelFill size={14} />
            </InputGroup.Text>
            <Form.Select
              value={filterCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
      </Row>
    </div>
  );
}
