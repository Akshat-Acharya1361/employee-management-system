import { buildListQueryString } from '../api/employeeApi';
import { DEFAULT_LIST_QUERY, readListQuery, toSearchParams } from './listQuery';

describe('list query in the URL', () => {
  it('round-trips every setting', () => {
    const query = {
      search: 'riya',
      department: 'Human Resources',
      status: 'INACTIVE' as const,
      page: 3,
      size: 20,
      sortField: 'salary' as const,
      sortDirection: 'desc' as const,
    };
    expect(readListQuery(toSearchParams(query))).toEqual(query);
  });

  it('keeps the URL empty for defaults', () => {
    expect(toSearchParams(DEFAULT_LIST_QUERY).toString()).toBe('');
  });

  it('falls back to defaults for malformed values', () => {
    const query = readListQuery(new URLSearchParams('page=-2&size=7&sort=password,up&status=RETIRED'));
    expect(query).toEqual(DEFAULT_LIST_QUERY);
  });
});

describe('buildListQueryString', () => {
  it('sends search, filters, zero-based page, size and sort to the API', () => {
    const queryString = buildListQueryString({
      ...DEFAULT_LIST_QUERY,
      search: '  aarav ',
      department: 'Engineering',
      status: 'ACTIVE',
      page: 1,
    });
    expect(Object.fromEntries(new URLSearchParams(queryString))).toEqual({
      search: 'aarav',
      department: 'Engineering',
      status: 'ACTIVE',
      page: '1',
      size: '10',
      sort: 'fullName,asc',
    });
  });

  it('omits paging for the CSV export', () => {
    expect(buildListQueryString(DEFAULT_LIST_QUERY, false)).toBe('sort=fullName%2Casc');
  });
});
