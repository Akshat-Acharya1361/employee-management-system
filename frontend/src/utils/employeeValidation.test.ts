import type { EmployeeInput } from '../api/types';
import { validateEmployeeInput } from './employeeValidation';

const validInput: EmployeeInput = {
  employeeCode: 'EMP-016',
  fullName: 'Riya Kapoor',
  email: 'riya.kapoor@example.com',
  phone: '+91 98260 12345',
  department: 'Engineering',
  designation: 'Software Engineer',
  joiningDate: '2024-09-02',
  salary: '750000.00',
  status: 'ACTIVE',
};

describe('validateEmployeeInput', () => {
  it('accepts a valid employee', () => {
    expect(validateEmployeeInput(validInput)).toEqual({});
  });

  it('requires every field', () => {
    const errors = validateEmployeeInput({
      ...validInput,
      employeeCode: ' ',
      fullName: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      joiningDate: '',
      salary: '',
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['department', 'designation', 'email', 'employeeCode', 'fullName', 'joiningDate', 'phone', 'salary'].sort(),
    );
  });

  it.each(['a@b', 'no-at-sign.com', 'two@@example.com'])('rejects email %s', (email) => {
    expect(validateEmployeeInput({ ...validInput, email }).email).toBeDefined();
  });

  it.each(['12345', '98260abc12', '+1 (555) 010-12345678901'])('rejects phone %s', (phone) => {
    expect(validateEmployeeInput({ ...validInput, phone }).phone).toBeDefined();
  });

  it.each(['+44 20 7946 0958', '(555) 010-1234', '9826012345'])('accepts international phone %s', (phone) => {
    expect(validateEmployeeInput({ ...validInput, phone }).phone).toBeUndefined();
  });

  it.each([
    ['-1', 'Salary cannot be negative'],
    ['12.345', 'Salary must be a number with at most 10 digits and 2 decimal places'],
    ['abc', 'Salary must be a number with at most 10 digits and 2 decimal places'],
  ])('rejects salary %s', (salary, message) => {
    expect(validateEmployeeInput({ ...validInput, salary }).salary).toBe(message);
  });

  it('accepts a salary of zero', () => {
    expect(validateEmployeeInput({ ...validInput, salary: '0' }).salary).toBeUndefined();
  });

  it('rejects a joining date in the future', () => {
    expect(validateEmployeeInput({ ...validInput, joiningDate: '2999-01-01' }).joiningDate).toBe(
      'Joining date cannot be in the future',
    );
  });
});
