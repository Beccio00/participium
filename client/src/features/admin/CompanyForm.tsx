import { Form } from 'react-bootstrap';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { ReportCategory } from '../../types';

interface CompanyFormFields {
  companyName: string;
  platformAccess: boolean;
  categories: ReportCategory[];
}

interface CompanyFormProps {
  values: CompanyFormFields;
  isSubmitting: boolean;
  availableCategories: ReportCategory[];
  onChange: (e: React.ChangeEvent<any>) => void;
  onCategoryToggle: (category: ReportCategory) => void;
  onPlatformAccessChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function CompanyForm({
  values,
  isSubmitting,
  availableCategories,
  onChange,
  onCategoryToggle,
  onPlatformAccessChange,
  onSubmit
}: CompanyFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Input
        type="text"
        id="companyName"
        name="companyName"
        label="Company Name"
        value={values.companyName}
        onChange={onChange}
        disabled={isSubmitting}
        required
        className="mb-3"
        placeholder="e.g. City Lighting S.r.l."
      />

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Service Categories</Form.Label>
        <div className="d-flex flex-wrap gap-3 p-3 bg-white border rounded">
          {availableCategories.map((cat) => (
            <Form.Check
              key={cat}
              type="checkbox"
              id={`cat-${cat}`}
              label={cat.replace(/_/g, " ")}
              checked={values.categories.includes(cat)}
              onChange={() => onCategoryToggle(cat)}
              disabled={
                values.categories.length >= 2 &&
                !values.categories.includes(cat)
              }
            />
          ))}
        </div>
        <Form.Text className="text-muted">
          Select the types of reports this company handles.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Check
          type="switch"
          id="platformAccess"
          label="Enable Platform Access"
          checked={values.platformAccess}
          onChange={(e) => onPlatformAccessChange(e.target.checked)}
          className="fw-semibold"
        />
        <Form.Text className="text-muted">
          If enabled, you can create maintainer accounts for this company to access the system directly.
        </Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Company"}
        </Button>
      </div>
    </form>
  );
}
