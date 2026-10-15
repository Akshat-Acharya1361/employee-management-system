import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError, employeeApi, isAbortError } from '../api/employeeApi';
import type { EmployeeInput } from '../api/types';
import { todayIsoDate } from '../utils/format';
import { toRequestBody, validateEmployeeInput, type EmployeeFormErrors } from '../utils/employeeValidation';

interface EmployeeFormProps {
  initialValues: EmployeeInput;
  mode: 'create' | 'edit';
  cancelHref: string;
  onSubmit: (employeeInput: EmployeeInput) => Promise<void>;
}

export const EMPTY_EMPLOYEE_INPUT: EmployeeInput = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  salary: '',
  status: 'ACTIVE',
};

type FieldName = keyof EmployeeInput;

/**
 * Shared add/edit form. Validates on submit (and re-validates touched fields as
 * the user types), shows server-side field errors, and disables the submit
 * button while a request is in flight to prevent double submissions.
 */
export function EmployeeForm({ initialValues, mode, cancelHref, onSubmit }: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeInput>(initialValues);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [knownDepartments, setKnownDepartments] = useState<string[]>([]);
  const formErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    employeeApi
      .listDepartments(controller.signal)
      .then(setKnownDepartments)
      .catch((error: unknown) => {
        // Department suggestions are optional; the field still accepts free text.
        if (!isAbortError(error)) setKnownDepartments([]);
      });
    return () => controller.abort();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = event.target.name as FieldName;
    const nextValues = { ...values, [fieldName]: event.target.value };
    setValues(nextValues);
    if (submitAttempted) {
      setErrors((current) => ({ ...current, [fieldName]: validateEmployeeInput(nextValues)[fieldName] }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitAttempted(true);
    setFormError(null);
    const validationErrors = validateEmployeeInput(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstInvalidField(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toRequestBody(values));
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const serverFieldErrors = error.fieldErrors as EmployeeFormErrors;
        setErrors(serverFieldErrors);
        // Field problems are shown next to each field; the banner only summarises them.
        setFormError(Object.keys(serverFieldErrors).length > 0 ? 'Please fix the highlighted fields.' : error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      formErrorRef.current?.focus();
      setSubmitting(false);
    }
  };

  const fieldProps = (fieldName: FieldName) => ({
    id: fieldName,
    name: fieldName,
    value: values[fieldName],
    onChange: handleChange,
    'aria-invalid': errors[fieldName] ? true : undefined,
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined,
  });

  const fieldError = (fieldName: FieldName) =>
    errors[fieldName] ? (
      <p id={`${fieldName}-error`} className="field__error">{errors[fieldName]}</p>
    ) : null;

  return (
    <form className="employee-form" onSubmit={handleSubmit} noValidate>
      <div ref={formErrorRef} tabIndex={-1} className="form-error-region">
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="employeeCode">Employee ID</label>
          <input
            {...fieldProps('employeeCode')}
            readOnly={mode === 'edit'}
            placeholder="EMP-016"
            autoComplete="off"
            aria-readonly={mode === 'edit' ? true : undefined}
          />
          {mode === 'edit' && <p className="field__hint">Employee ID cannot be changed.</p>}
          {fieldError('employeeCode')}
        </div>

        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input {...fieldProps('fullName')} autoComplete="name" />
          {fieldError('fullName')}
        </div>

        <div className="field">
          <label htmlFor="email">Email address</label>
          <input {...fieldProps('email')} type="email" autoComplete="email" />
          {fieldError('email')}
        </div>

        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input {...fieldProps('phone')} type="tel" autoComplete="tel" placeholder="+91 98260 12345" />
          {fieldError('phone')}
        </div>

        <div className="field">
          <label htmlFor="department">Department</label>
          <input {...fieldProps('department')} list="department-options" autoComplete="off" />
          <datalist id="department-options">
            {knownDepartments.map((department) => (
              <option key={department} value={department} />
            ))}
          </datalist>
          {fieldError('department')}
        </div>

        <div className="field">
          <label htmlFor="designation">Designation</label>
          <input {...fieldProps('designation')} autoComplete="organization-title" />
          {fieldError('designation')}
        </div>

        <div className="field">
          <label htmlFor="joiningDate">Date of joining</label>
          <input {...fieldProps('joiningDate')} type="date" max={todayIsoDate()} />
          {fieldError('joiningDate')}
        </div>

        <div className="field">
          <label htmlFor="salary">Annual salary (INR)</label>
          <input {...fieldProps('salary')} inputMode="decimal" placeholder="750000.00" />
          {fieldError('salary')}
        </div>

        <div className="field">
          <label htmlFor="status">Employment status</label>
          <select {...fieldProps('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {fieldError('status')}
        </div>
      </div>

      <div className="form-actions">
        <Link to={cancelHref} className="button button--secondary">Cancel</Link>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Add employee' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function focusFirstInvalidField(errors: EmployeeFormErrors) {
  const firstInvalidField = Object.keys(EMPTY_EMPLOYEE_INPUT).find((fieldName) => errors[fieldName as FieldName]);
  if (firstInvalidField) document.getElementById(firstInvalidField)?.focus();
}
