import type { EmployeeInput } from '../api/types';
import { todayIsoDate } from './format';

export type EmployeeFormErrors = Partial<Record<keyof EmployeeInput, string>>;

const EMPLOYEE_CODE_PATTERN = /^[A-Za-z0-9-]{3,20}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_CHARACTERS_PATTERN = /^\+?[0-9()\s-]+$/;
const SALARY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

/**
 * Client-side checks that mirror the backend rules so users get instant feedback.
 * The backend still validates everything; this is only a convenience.
 */
export function validateEmployeeInput(employeeInput: EmployeeInput): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};

  const employeeCode = employeeInput.employeeCode.trim();
  if (!employeeCode) errors.employeeCode = 'Employee ID is required';
  else if (!EMPLOYEE_CODE_PATTERN.test(employeeCode)) {
    errors.employeeCode = 'Employee ID must be 3-20 letters, digits or hyphens';
  }

  if (!employeeInput.fullName.trim()) errors.fullName = 'Full name is required';
  else if (employeeInput.fullName.trim().length > 100) errors.fullName = 'Full name must be at most 100 characters';

  const email = employeeInput.email.trim();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email) || email.length > 150) errors.email = 'Email must be a valid address';

  const phone = employeeInput.phone.trim();
  const phoneDigitCount = phone.replace(/\D/g, '').length;
  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE_CHARACTERS_PATTERN.test(phone) || phoneDigitCount < 7 || phoneDigitCount > 15 || phone.length > 20) {
    errors.phone = 'Phone number must contain 7-15 digits and only +, spaces, hyphens or brackets';
  }

  if (!employeeInput.department.trim()) errors.department = 'Department is required';
  else if (employeeInput.department.trim().length > 60) errors.department = 'Department must be at most 60 characters';

  if (!employeeInput.designation.trim()) errors.designation = 'Designation is required';
  else if (employeeInput.designation.trim().length > 80) {
    errors.designation = 'Designation must be at most 80 characters';
  }

  if (!employeeInput.joiningDate) errors.joiningDate = 'Joining date is required';
  else if (employeeInput.joiningDate > todayIsoDate()) errors.joiningDate = 'Joining date cannot be in the future';

  const salary = employeeInput.salary.trim();
  if (!salary) errors.salary = 'Salary is required';
  else if (salary.startsWith('-')) errors.salary = 'Salary cannot be negative';
  else if (!SALARY_PATTERN.test(salary)) {
    errors.salary = 'Salary must be a number with at most 10 digits and 2 decimal places';
  }

  return errors;
}

/** Trims text fields before sending; the backend normalises case for ID and email. */
export function toRequestBody(employeeInput: EmployeeInput) {
  return {
    employeeCode: employeeInput.employeeCode.trim(),
    fullName: employeeInput.fullName.trim(),
    email: employeeInput.email.trim(),
    phone: employeeInput.phone.trim(),
    department: employeeInput.department.trim(),
    designation: employeeInput.designation.trim(),
    joiningDate: employeeInput.joiningDate,
    salary: employeeInput.salary.trim(),
    status: employeeInput.status,
  };
}
