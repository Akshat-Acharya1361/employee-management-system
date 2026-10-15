import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Employee, PageResponse } from '../api/types';
import { EmployeeListPage } from './EmployeeListPage';

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

function page(content: Employee[], totalElements = content.length): PageResponse<Employee> {
  return { content, page: 0, size: 10, totalElements, totalPages: Math.ceil(totalElements / 10), first: true, last: true, sort: 'fullName,asc' };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Routes fake API calls by URL; records every request URL. */
function stubApi(listPage: PageResponse<Employee>) {
  const requests: { url: string; method: string }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    requests.push({ url, method });
    if (url.includes('/departments')) return jsonResponse(['Engineering', 'Sales']);
    if (method === 'DELETE') return new Response(null, { status: 204 });
    return jsonResponse(listPage);
  });
  vi.stubGlobal('fetch', fetchMock);
  return requests;
}

function renderList(initialUrl = '/employees') {
  render(
    <MemoryRouter initialEntries={[initialUrl]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <EmployeeListPage />
    </MemoryRouter>,
  );
}

describe('EmployeeListPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders employees returned by the API', async () => {
    stubApi(page([aarav]));
    renderList();

    const row = (await screen.findByText('Aarav Sharma')).closest('tr')!;
    expect(within(row).getByText('EMP-001')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–1 of 1')).toBeInTheDocument();
  });

  it('sends filters, paging and sort from the URL to the API together', async () => {
    const requests = stubApi(page([aarav], 25));
    renderList('/employees?search=aar&department=Engineering&status=ACTIVE&page=1&sort=salary,desc');

    await screen.findByText('Aarav Sharma');
    const listRequest = requests.find((request) => request.url.includes('/api/employees?'))!;
    const params = new URL(listRequest.url).searchParams;
    expect(Object.fromEntries(params)).toEqual({
      search: 'aar',
      department: 'Engineering',
      status: 'ACTIVE',
      page: '1',
      size: '10',
      sort: 'salary,desc',
    });
  });

  it('shows an empty state when nothing matches the filters', async () => {
    stubApi(page([]));
    renderList('/employees?status=INACTIVE');

    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument();
  });

  it('shows an error with a retry button when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderList();

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('deletes only after the user confirms', async () => {
    const user = userEvent.setup();
    const requests = stubApi(page([aarav]));
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Delete Aarav Sharma' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(requests.some((request) => request.method === 'DELETE')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Delete Aarav Sharma' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete employee' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Aarav Sharma (EMP-001) was deleted.'));
    const deleteRequest = requests.find((request) => request.method === 'DELETE')!;
    expect(deleteRequest.url).toMatch(/\/api\/employees\/1$/);
  });
});
