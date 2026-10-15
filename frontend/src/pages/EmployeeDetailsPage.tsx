import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeeApi } from '../api/employeeApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatSalary } from '../utils/format';
import { NotFoundPanel } from './NotFoundPanel';
import { useEmployee } from './useEmployee';

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reloadToken, setReloadToken] = useState(0);
  const loadState = useEmployee(id, reloadToken);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loadState.kind === 'loading') return <div className="state-panel" role="status">Loading employee…</div>;
  if (loadState.kind === 'not-found') return <NotFoundPanel />;
  if (loadState.kind === 'error') {
    return (
      <div className="state-panel state-panel--error" role="alert">
        <p>{loadState.message}</p>
        <button type="button" className="button button--secondary" onClick={() => setReloadToken((token) => token + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const { employee } = loadState;

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await employeeApi.remove(employee.id);
      navigate('/employees', { state: { notice: `${employee.fullName} (${employee.employeeCode}) was deleted.` } });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete the employee');
      setDeleting(false);
    }
  };

  const details: [string, ReactNode][] = [
    ['Employee ID', <span className="cell-mono">{employee.employeeCode}</span>],
    ['Email address', <a href={`mailto:${employee.email}`}>{employee.email}</a>],
    ['Phone number', <a href={`tel:${employee.phone.replace(/[^\d+]/g, '')}`}>{employee.phone}</a>],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Date of joining', formatDate(employee.joiningDate)],
    ['Annual salary', formatSalary(employee.salary)],
    ['Employment status', <StatusBadge status={employee.status} />],
  ];

  return (
    <section>
      <Link to="/employees" className="back-link">← All employees</Link>
      <div className="page-header">
        <div>
          <h1>{employee.fullName}</h1>
          <p className="page-header__subtitle">{employee.designation} · {employee.department}</p>
        </div>
        <div className="page-header__actions">
          <Link to={`/employees/${employee.id}/edit`} className="button button--primary">Edit</Link>
          <button type="button" className="button button--danger-outline" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      <dl className="details-grid">
        {details.map(([label, value]) => (
          <div key={label} className="details-grid__item">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete employee?"
          message={`This permanently removes ${employee.fullName} (${employee.employeeCode}). This cannot be undone.`}
          confirmLabel="Delete employee"
          busy={deleting}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </section>
  );
}
