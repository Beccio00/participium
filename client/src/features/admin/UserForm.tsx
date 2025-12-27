import { Form } from 'react-bootstrap';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { ExternalCompanyResponse } from '../../types';
import { MUNICIPALITY_ROLES, getRoleLabel } from '../../utils/roles';

import type { MunicipalityUserRoles } from "../../../../shared/MunicipalityUserTypes";
interface UserFormFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: MunicipalityUserRoles[];
  externalCompanyId?: string;
}

interface UserFormProps {
  values: UserFormFields;
  isSubmitting: boolean;
  isInternal: boolean;
  companies?: ExternalCompanyResponse[];
  addButtonLabel: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function UserForm({
  values,
  isSubmitting,
  isInternal,
  companies = [],
  addButtonLabel,
  onChange,
  onSubmit
    }: UserFormProps) {

      const ROLE_OPTIONS = MUNICIPALITY_ROLES.map((role) => ({
        value: role,
        label: getRoleLabel(role),
      }));

      const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
        onChange({
          target: {
            name: "role",
            value: selected,
          },
        } as any);
      };

      return (
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Input
                type="text"
                id="firstName"
                name="firstName"
                label="First Name"
                value={values.firstName}
                onChange={onChange}
                disabled={isSubmitting}
                required
                placeholder="e.g. Mario"
              />
            </div>
            <div className="col-md-6">
              <Input
                type="text"
                id="lastName"
                name="lastName"
                label="Last Name"
                value={values.lastName}
                onChange={onChange}
                disabled={isSubmitting}
                required
                placeholder="e.g. Rossi"
              />
            </div>
          </div>

          <Input
            type="email"
            id="email"
            name="email"
            label="Email Address"
            value={values.email}
            onChange={onChange}
            disabled={isSubmitting}
            required
            className="mb-3"
            placeholder="name@example.com"
          />

          <Input
            type="password"
            id="password"
            name="password"
            label="Password"
            value={values.password}
            onChange={onChange}
            disabled={isSubmitting}
            minLength={8}
            required
            className="mb-3"
            placeholder="Min. 8 characters"
          />

          {isInternal && (
            <Form.Group className="mb-4">
              <Form.Label htmlFor="role" className="fw-semibold">
                Roles
              </Form.Label>
              <Form.Select
                id="role"
                name="role"
                value={Array.isArray(values.role) ? values.role : values.role ? [values.role] : []}
                onChange={handleRoleChange}
                multiple
                required
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold Ctrl (Cmd on Mac) to select multiple roles.
              </Form.Text>
            </Form.Group>
          )}

          {!isInternal && (
            <Form.Group className="mb-4">
              <Form.Label htmlFor="externalCompanyId" className="fw-semibold">
                Associated Company
              </Form.Label>
              <Form.Select
                id="externalCompanyId"
                name="externalCompanyId"
                value={values.externalCompanyId || ''}
                onChange={onChange}
                disabled={isSubmitting}
                required
              >
                <option value="">- Select a company -</option>
                {companies
                  .filter((c) => c.platformAccess)
                  .map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Only companies with "Platform Access" enabled are listed here.
              </Form.Text>
            </Form.Group>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Creating..." : `Create ${addButtonLabel}`}
            </Button>
          </div>
        </form>
      );
    }
