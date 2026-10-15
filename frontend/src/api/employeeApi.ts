import type { Employee, EmployeeInput, EmployeeListQuery, PageResponse } from './types';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

/** Error thrown for any failed API call; mirrors the backend's ApiError JSON. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ApiErrorBody {
  message?: string;
  fieldErrors?: { field: string; message: string }[];
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiRequestError(0, `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody;
    const fieldErrors: Record<string, string> = {};
    for (const fieldError of errorBody.fieldErrors ?? []) {
      fieldErrors[fieldError.field] ??= fieldError.message;
    }
    throw new ApiRequestError(
      response.status,
      errorBody.message ?? `Request failed with status ${response.status}`,
      fieldErrors,
    );
  }
  return body as T;
}

/** Builds the query string shared by the list and CSV export endpoints. Empty filters are left out. */
export function buildListQueryString(query: EmployeeListQuery, includePaging = true): string {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.department) params.set('department', query.department);
  if (query.status) params.set('status', query.status);
  if (includePaging) {
    params.set('page', String(query.page));
    params.set('size', String(query.size));
  }
  params.set('sort', `${query.sortField},${query.sortDirection}`);
  return params.toString();
}

export const employeeApi = {
  list(query: EmployeeListQuery, signal?: AbortSignal): Promise<PageResponse<Employee>> {
    return request(`/api/employees?${buildListQueryString(query)}`, { signal });
  },

  get(id: number, signal?: AbortSignal): Promise<Employee> {
    return request(`/api/employees/${id}`, { signal });
  },

  listDepartments(signal?: AbortSignal): Promise<string[]> {
    return request('/api/employees/departments', { signal });
  },

  create(employeeInput: EmployeeInput): Promise<Employee> {
    return request('/api/employees', { method: 'POST', body: JSON.stringify(employeeInput) });
  },

  update(id: number, employeeInput: EmployeeInput): Promise<Employee> {
    return request(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(employeeInput) });
  },

  remove(id: number): Promise<void> {
    return request(`/api/employees/${id}`, { method: 'DELETE' });
  },

  exportUrl(query: EmployeeListQuery): string {
    return `${API_BASE_URL}/api/employees/export?${buildListQueryString(query, false)}`;
  },
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
