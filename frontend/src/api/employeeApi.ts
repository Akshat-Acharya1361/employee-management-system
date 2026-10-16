import { clearSession, getSession, SESSION_EXPIRED_EVENT } from '../auth/session';
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

/**
 * Sends a request with the signed-in user's credentials and turns failures into ApiRequestError.
 * A 401 means the stored credentials are no longer valid: they are cleared and the app is told,
 * so it can send the user back to the login page.
 */
async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';
  const session = getSession();
  if (session) headers.Authorization = session.authorization;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiRequestError(0, `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`);
  }

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  if (!response.ok) throw await toApiRequestError(response);
  return response;
}

export async function toApiRequestError(response: Response): Promise<ApiRequestError> {
  const errorBody = ((await response.json().catch(() => null)) ?? {}) as ApiErrorBody;
  const fieldErrors: Record<string, string> = {};
  for (const fieldError of errorBody.fieldErrors ?? []) {
    fieldErrors[fieldError.field] ??= fieldError.message;
  }
  return new ApiRequestError(
    response.status,
    errorBody.message ?? `Request failed with status ${response.status}`,
    fieldErrors,
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await send(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
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

  /** Downloads the CSV with the user's credentials (a plain link could not send the Authorization header). */
  async exportCsv(query: EmployeeListQuery): Promise<Blob> {
    const response = await send(`/api/employees/export?${buildListQueryString(query, false)}`);
    return response.blob();
  },
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
