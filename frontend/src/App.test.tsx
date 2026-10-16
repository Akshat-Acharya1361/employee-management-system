import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import type { Employee, PageResponse } from './api/types';
import { AuthProvider } from './auth/AuthContext';
import { clearSession, encodeBasicCredentials, getSession, saveSession } from './auth/session';

const VALID_AUTHORIZATION = encodeBasicCredentials('admin', 'admin123');

const aarav: Employee = {
  id: 1,
  employeeCode: 'EMP-001',
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '+91 98260 11001',
  department: 'Engineering',
  designation: 'Software Engineer',
  joiningDate: '2022-07-11',
  salary: 850000,
  status: 'ACTIVE',
  createdAt: null,
  updatedAt: null,
};

const onePage: PageResponse<Employee> = {
  content: [aarav], page: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true, sort: 'fullName,asc',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const unauthorized = () => jsonResponse({ status: 401, message: 'Invalid or missing username and password' }, 401);

/** A fake backend that accepts only admin / admin123, like the real one with local defaults. */
function stubBackend() {
  const requests: { url: string; authorization?: string }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
    requests.push({ url, authorization });
    if (authorization !== VALID_AUTHORIZATION) return unauthorized();
    if (url.endsWith('/api/auth/me')) return jsonResponse({ username: 'admin' });
    if (url.includes('/departments')) return jsonResponse(['Engineering']);
    if (url.includes('/export')) return new Response('Employee ID\r\n', { status: 200, headers: { 'Content-Type': 'text/csv' } });
    return jsonResponse(onePage);
  });
  vi.stubGlobal('fetch', fetchMock);
  return requests;
}

function renderApp(url: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

async function signIn(user: ReturnType<typeof userEvent.setup>, password: string) {
  await user.type(screen.getByLabelText('Username'), 'admin');
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('login and logout', () => {
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('sends a signed-out user to the login page instead of the employee list', async () => {
    const requests = stubBackend();
    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(requests.some((request) => request.url.includes('/api/employees'))).toBe(false);
  });

  it('signs in and returns to the page that was originally requested', async () => {
    const user = userEvent.setup();
    const requests = stubBackend();
    renderApp('/employees?status=ACTIVE');

    await signIn(user, 'admin123');

    expect(await screen.findByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(getSession()?.username).toBe('admin');
    const listRequest = requests.find((request) => request.url.includes('/api/employees?'))!;
    expect(new URL(listRequest.url).searchParams.get('status')).toBe('ACTIVE');
    expect(listRequest.authorization).toBe(VALID_AUTHORIZATION);
  });

  it('shows an error and stays signed out for a wrong password', async () => {
    const user = userEvent.setup();
    stubBackend();
    renderApp('/login');

    await signIn(user, 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(getSession()).toBeNull();
  });

  it('logs out and protects the pages again', async () => {
    const user = userEvent.setup();
    saveSession({ username: 'admin', authorization: VALID_AUTHORIZATION });
    stubBackend();
    renderApp('/employees');

    await screen.findByText('Aarav Sharma');
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it('returns to the login page when the stored credentials are rejected', async () => {
    saveSession({ username: 'admin', authorization: encodeBasicCredentials('admin', 'old-password') });
    stubBackend();
    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your session has ended. Please sign in again.');
  });

  it('downloads the CSV with the Authorization header', async () => {
    const user = userEvent.setup();
    saveSession({ username: 'admin', authorization: VALID_AUTHORIZATION });
    const requests = stubBackend();
    const createObjectURL = vi.fn(() => 'blob:employees');
    // jsdom does not implement object URLs
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp('/employees?department=Engineering');

    await screen.findByText('Aarav Sharma');
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    const exportRequest = requests.find((request) => request.url.includes('/api/employees/export'))!;
    expect(exportRequest.authorization).toBe(VALID_AUTHORIZATION);
    expect(new URL(exportRequest.url).searchParams.get('department')).toBe('Engineering');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it('shows the signed-in username in the header', async () => {
    saveSession({ username: 'admin', authorization: VALID_AUTHORIZATION });
    stubBackend();
    renderApp('/employees');

    const header = screen.getByRole('banner');
    expect(within(header).getByText('admin')).toBeInTheDocument();
    await screen.findByText('Aarav Sharma');
  });
});
