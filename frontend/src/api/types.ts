export type EmploymentStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  /** ISO date, YYYY-MM-DD */
  joiningDate: string;
  salary: number;
  status: EmploymentStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Body sent to POST/PUT /api/employees. */
export interface EmployeeInput {
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: string;
  status: EmploymentStatus;
}

export interface PageResponse<T> {
  content: T[];
  /** zero-based */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort: string;
}

export type SortField =
  | 'employeeCode'
  | 'fullName'
  | 'email'
  | 'department'
  | 'designation'
  | 'joiningDate'
  | 'salary'
  | 'status';

export type SortDirection = 'asc' | 'desc';

export interface EmployeeListQuery {
  search: string;
  department: string;
  status: EmploymentStatus | '';
  /** zero-based */
  page: number;
  size: number;
  sortField: SortField;
  sortDirection: SortDirection;
}
