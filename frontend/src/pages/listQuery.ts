import type { EmployeeListQuery, EmploymentStatus, SortDirection, SortField } from '../api/types';
import { PAGE_SIZE_OPTIONS } from '../components/Pagination';

export const SORT_FIELDS: SortField[] = [
  'employeeCode',
  'fullName',
  'email',
  'department',
  'designation',
  'joiningDate',
  'salary',
  'status',
];

export const DEFAULT_LIST_QUERY: EmployeeListQuery = {
  search: '',
  department: '',
  status: '',
  page: 0,
  size: PAGE_SIZE_OPTIONS[0],
  sortField: 'fullName',
  sortDirection: 'asc',
};

/**
 * The list state lives in the URL (?search=&department=&status=&page=&size=&sort=)
 * so filters survive paging, refreshes, the back button and shared links.
 * Unknown or malformed values fall back to defaults instead of breaking the page.
 */
export function readListQuery(searchParams: URLSearchParams): EmployeeListQuery {
  const statusParam = searchParams.get('status');
  const status: EmploymentStatus | '' = statusParam === 'ACTIVE' || statusParam === 'INACTIVE' ? statusParam : '';

  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam >= 0 ? pageParam : 0;

  const sizeParam = Number(searchParams.get('size'));
  const size = PAGE_SIZE_OPTIONS.includes(sizeParam) ? sizeParam : DEFAULT_LIST_QUERY.size;

  const [sortFieldParam, sortDirectionParam] = (searchParams.get('sort') ?? '').split(',');
  const sortField = SORT_FIELDS.includes(sortFieldParam as SortField)
    ? (sortFieldParam as SortField)
    : DEFAULT_LIST_QUERY.sortField;
  const sortDirection: SortDirection = sortDirectionParam === 'desc' ? 'desc' : 'asc';

  return {
    search: searchParams.get('search') ?? '',
    department: searchParams.get('department') ?? '',
    status,
    page,
    size,
    sortField,
    sortDirection,
  };
}

/** Writes only non-default values so URLs stay short. */
export function toSearchParams(query: EmployeeListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.department) params.set('department', query.department);
  if (query.status) params.set('status', query.status);
  if (query.page > 0) params.set('page', String(query.page));
  if (query.size !== DEFAULT_LIST_QUERY.size) params.set('size', String(query.size));
  if (query.sortField !== DEFAULT_LIST_QUERY.sortField || query.sortDirection !== DEFAULT_LIST_QUERY.sortDirection) {
    params.set('sort', `${query.sortField},${query.sortDirection}`);
  }
  return params;
}
