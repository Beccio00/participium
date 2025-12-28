import * as React from "react";
import { Form } from "react-bootstrap";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import type { ExternalCompanyResponse } from "../../types";
import { MUNICIPALITY_ROLES, getRoleLabel } from "../../utils/roles";
import type { MunicipalityUserRoles } from "../../../../shared/MunicipalityUserTypes";

interface UserFormFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: MunicipalityUserRoles[]; // ✅ sempre array
  externalCompanyId?: string; // string per compatibilità form
}

interface UserFormProps {
  values: UserFormFields;
  isSubmitting: boolean;
  isInternal: boolean;
  companies?: ExternalCompanyResponse[];
  onChange: (e: React.ChangeEvent<any>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function UserForm({
  values,
  isSubmitting,
  isInternal,
  companies = [],
  onChange,
  onSubmit,
}: UserFormProps) {
  const roleOptions = React.useMemo(
    () =>
      MUNICIPALITY_ROLES.map((role) => ({
        value: role,
        label: getRoleLabel(role),
      })),
    []
  );


  const availableCompanies = React.useMemo(
    () => companies.filter((c) => c.platformAccess),
    [companies]
  );

  const submitLabel = isSubmitting
    ? "Saving..."
    : "Save";

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

      {isInternal ? (
        <Form.Group className="mb-4">
          <Form.Label className="fw-semibold mb-2">Roles</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {roleOptions.map((opt) => (
              <Form.Check
                key={opt.value}
                type="checkbox"
                id={`role-${opt.value}`}
                name="role"
                value={opt.value}
                label={opt.label}
                checked={values.role.includes(opt.value as MunicipalityUserRoles)}
                disabled={isSubmitting}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const value = opt.value as MunicipalityUserRoles;
                  let newRoles: MunicipalityUserRoles[];
                  if (checked) {
                    newRoles = [...values.role, value];
                  } else {
                    newRoles = values.role.filter((r) => r !== value);
                  }
                  // Simula un evento compatibile con useForm
                  const syntheticEvent = {
                    target: {
                      name: "role",
                      value: newRoles,
                    },
                  } as unknown as React.ChangeEvent<any>;
                  onChange(syntheticEvent);
                }}
                className="me-3 mb-1"
              />
            ))}
          </div>
          <Form.Text className="text-muted">
            Select one or more roles for this user.
          </Form.Text>
        </Form.Group>
      ) : (
        <Form.Group className="mb-4">
          <Form.Label htmlFor="externalCompanyId" className="fw-semibold">
            Associated Company
          </Form.Label>

          <Form.Select
            id="externalCompanyId"
            name="externalCompanyId"
            value={values.externalCompanyId ?? ""}
            onChange={onChange}
            disabled={isSubmitting}
            required
          >
            <option value="">- Select a company -</option>
            {availableCompanies.map((company) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </Form.Select>

          <Form.Text className="text-muted">
            Only companies with &quot;Platform Access&quot; enabled are listed here.
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
