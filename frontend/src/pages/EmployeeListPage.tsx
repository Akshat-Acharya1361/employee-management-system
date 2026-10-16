import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { employeeApi, isAbortError } from '../api/employeeApi';
import type { Employee, EmployeeListQuery, PageResponse, SortField } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatSalary } from '../utils/format';
import { DEFAULT_LIST_QUERY, readListQuery, toSearchParams } from './listQuery';

const SEARCH_DEBOUNCE_MS = 300;

interface Column {
  field: SortField;
  label: string;
}

const COLUMNS: Column[] = [
  { field: 'employeeCode', label: 'Employee ID' },
  { field: 'fullName', label: 'Name' },
  { field: 'email', label: 'Email' },
  { field: 'department', label: 'Department' },
  { field: 'designation', label: 'Designation' },
  { field: 'joiningDate', label: 'Joined' },
  { field: 'salary', label: 'Salary' },
  { field: 'status', label: 'Status' },
];

export function EmployeeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = readListQuery(searchParams);
  const queryKey = toSearchParams(query).toString();

  const [searchDraft, setSearchDraft] = useState(query.search);
  // The search text this page last wrote to the URL; lets us tell our own updates from back/forward navigation.
  const lastPushedSearch = useRef(query.search);
  const [workforcePage, setWorkforcePage] = useState<PageResponse<Employee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const updateQuery = useCallback(
    (changes: Partial<EmployeeListQuery>) => {
      const nextQuery = { ...readListQuery(searchParams), ...changes };
      setSearchParams(toSearchParams(nextQuery));
    },
    [searchParams, setSearchParams],
  );

  // Keep the search box in sync when the URL changes (e.g. back button).
  useEffect(() => {
    if (query.search !== lastPushedSearch.current) {
      lastPushedSearch.current = query.search;
      setSearchDraft(query.search);
    }
  }, [query.search]);

  // Debounce typing so we do not call the API on every keystroke.
  useEffect(() => {
    if (searchDraft === query.search) return;
    const timer = window.setTimeout(() => {
      lastPushedSearch.current = searchDraft;
      updateQuery({ search: searchDraft, page: 0 });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchDraft, query.search, updateQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    employeeApi
      .list(readListQuery(new URLSearchParams(queryKey)), controller.signal)
      .then((result) => {
        setWorkforcePage(result);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setLoadError(error instanceof Error ? error.message : 'Could not load employees');
        setLoading(false);
      });
    return () => controller.abort();
  }, [queryKey, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();
    employeeApi
      .listDepartments(controller.signal)
      .then(setDepartments)
      .catch(() => {
        /* the filter still works with the current selection; nothing else to do */
      });
    return () => controller.abort();
  }, [reloadToken]);

  // If the current page no longer exists (e.g. after deleting its last row), jump to the last page.
  useEffect(() => {
    if (workforcePage && workforcePage.content.length === 0 && workforcePage.totalPages > 0 && query.page >= workforcePage.totalPages) {
      updateQuery({ page: workforcePage.totalPages - 1 });
    }
  }, [workforcePage, query.page, updateQuery]);

  const toggleSort = (field: SortField) => {
    const sortDirection = query.sortField === field && query.sortDirection === 'asc' ? 'desc' : 'asc';
    updateQuery({ sortField: field, sortDirection, page: 0 });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await employeeApi.remove(pendingDelete.id);
      setNotice(`${pendingDelete.fullName} (${pendingDelete.employeeCode}) was deleted.`);
      setPendingDelete(null);
      setReloadToken((token) => token + 1);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete the employee');
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const csvFile = await employeeApi.exportCsv(query);
      const downloadUrl = URL.createObjectURL(csvFile);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'employees.csv';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not export employees');
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters = Boolean(query.search || query.department || query.status);
  const departmentOptions =
    query.department && !departments.includes(query.department) ? [...departments, query.department] : departments;

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-header__subtitle">Search, filter and manage employee records.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="button button--secondary" onClick={exportCsv} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <Link to="/employees/new" className="button button--primary">Add employee</Link>
        </div>
      </div>

      {notice && (
        <div className="notice notice--success" role="status">
          <span>{notice}</span>
          <button type="button" className="notice__dismiss" onClick={() => setNotice(null)} aria-label="Dismiss message">×</button>
        </div>
      )}

      {exportError && <p className="form-error" role="alert">{exportError}</p>}

      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field filters__search">
          <label htmlFor="employee-search">Search by name or email</label>
          <input
            id="employee-search"
            type="search"
            value={searchDraft}
            placeholder="e.g. Aarav or aarav@example.com"
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="department-filter">Department</label>
          <select
            id="department-filter"
            value={query.department}
            onChange={(event) => updateQuery({ department: event.target.value, page: 0 })}
          >
            <option value="">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={query.status}
            onChange={(event) => updateQuery({ status: event.target.value as EmployeeListQuery['status'], page: 0 })}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="button button--link filters__clear"
            onClick={() => {
              setSearchDraft('');
              lastPushedSearch.current = '';
              setSearchParams(toSearchParams({ ...DEFAULT_LIST_QUERY, size: query.size, sortField: query.sortField, sortDirection: query.sortDirection }));
            }}
          >
            Clear filters
          </button>
        )}
      </form>

      {loadError ? (
        <div className="state-panel state-panel--error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="button button--secondary" onClick={() => setReloadToken((token) => token + 1)}>
            Try again
          </button>
        </div>
      ) : !workforcePage ? (
        <div className="state-panel" role="status">Loading employees…</div>
      ) : workforcePage.totalElements === 0 ? (
        <div className="state-panel" role="status">
          {hasActiveFilters ? (
            <p>No employees match these filters.</p>
          ) : (
            <>
              <p>No employees yet.</p>
              <Link to="/employees/new" className="button button--primary">Add the first employee</Link>
            </>
          )}
        </div>
      ) : (
        <div className={`table-wrapper${loading ? ' table-wrapper--loading' : ''}`} aria-busy={loading}>
          <table className="employee-table">
            <caption className="visually-hidden">
              Employees, sorted by {COLUMNS.find((column) => column.field === query.sortField)?.label}{' '}
              {query.sortDirection === 'asc' ? 'ascending' : 'descending'}
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((column) => {
                  const isSorted = query.sortField === column.field;
                  return (
                    <th
                      key={column.field}
                      scope="col"
                      aria-sort={isSorted ? (query.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button type="button" className="sort-button" onClick={() => toggleSort(column.field)}>
                        {column.label}
                        <span aria-hidden="true" className="sort-button__icon">
                          {isSorted ? (query.sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {workforcePage.content.map((employeeRecord) => (
                <tr key={employeeRecord.id}>
                  <td data-label="Employee ID"><span className="cell-mono">{employeeRecord.employeeCode}</span></td>
                  <td data-label="Name">
                    <Link to={`/employees/${employeeRecord.id}`} className="cell-name">{employeeRecord.fullName}</Link>
                  </td>
                  <td data-label="Email" className="cell-email">{withBreakBeforeAt(employeeRecord.email)}</td>
                  <td data-label="Department">{employeeRecord.department}</td>
                  <td data-label="Designation">{employeeRecord.designation}</td>
                  <td data-label="Joined" className="cell-nowrap">{formatDate(employeeRecord.joiningDate)}</td>
                  <td data-label="Salary" className="cell-number">{formatSalary(employeeRecord.salary)}</td>
                  <td data-label="Status"><StatusBadge status={employeeRecord.status} /></td>
                  <td className="cell-actions">
                    <div className="cell-actions__buttons">
                      <Link to={`/employees/${employeeRecord.id}/edit`} className="button button--small button--secondary"
                        aria-label={`Edit ${employeeRecord.fullName}`}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="button button--small button--danger-outline"
                        aria-label={`Delete ${employeeRecord.fullName}`}
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(employeeRecord);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {workforcePage && workforcePage.totalElements > 0 && !loadError && (
        <Pagination
          page={query.page}
          size={query.size}
          totalPages={workforcePage.totalPages}
          totalElements={workforcePage.totalElements}
          onPageChange={(page) => updateQuery({ page })}
          onSizeChange={(size) => updateQuery({ size, page: 0 })}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete employee?"
          message={`This permanently removes ${pendingDelete.fullName} (${pendingDelete.employeeCode}). This cannot be undone.`}
          confirmLabel="Delete employee"
          busy={deleting}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}

/** Lets long email addresses wrap at the "@" instead of mid-word. */
function withBreakBeforeAt(email: string) {
  const atIndex = email.indexOf('@');
  if (atIndex < 0) return email;
  return (
    <>
      {email.slice(0, atIndex)}
      <wbr />
      {email.slice(atIndex)}
    </>
  );
}
