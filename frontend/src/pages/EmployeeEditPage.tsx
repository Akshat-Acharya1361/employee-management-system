import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeeApi } from '../api/employeeApi';
import type { Employee, EmployeeInput } from '../api/types';
import { EmployeeForm } from '../components/EmployeeForm';
import { NotFoundPanel } from './NotFoundPanel';
import { useEmployee } from './useEmployee';

function toFormValues(employee: Employee): EmployeeInput {
  return {
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    salary: Number(employee.salary).toFixed(2),
    status: employee.status,
  };
}

export function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loadState = useEmployee(id);

  if (loadState.kind === 'loading') return <div className="state-panel" role="status">Loading employee…</div>;
  if (loadState.kind === 'not-found') return <NotFoundPanel />;
  if (loadState.kind === 'error') {
    return <div className="state-panel state-panel--error" role="alert">{loadState.message}</div>;
  }

  const { employee } = loadState;
  const detailsHref = `/employees/${employee.id}`;

  return (
    <section>
      <Link to={detailsHref} className="back-link">← Back to {employee.fullName}</Link>
      <div className="page-header">
        <h1>Edit employee</h1>
      </div>
      <EmployeeForm
        mode="edit"
        initialValues={toFormValues(employee)}
        cancelHref={detailsHref}
        onSubmit={async (employeeInput) => {
          const updated = await employeeApi.update(employee.id, employeeInput);
          navigate(detailsHref, { state: { notice: `Changes to ${updated.fullName} were saved.` } });
        }}
      />
    </section>
  );
}
