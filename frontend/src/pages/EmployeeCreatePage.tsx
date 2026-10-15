import { Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../api/employeeApi';
import { EMPTY_EMPLOYEE_INPUT, EmployeeForm } from '../components/EmployeeForm';

export function EmployeeCreatePage() {
  const navigate = useNavigate();

  return (
    <section>
      <Link to="/employees" className="back-link">← All employees</Link>
      <div className="page-header">
        <h1>Add employee</h1>
      </div>
      <EmployeeForm
        mode="create"
        initialValues={EMPTY_EMPLOYEE_INPUT}
        cancelHref="/employees"
        onSubmit={async (employeeInput) => {
          const created = await employeeApi.create(employeeInput);
          navigate(`/employees/${created.id}`, {
            state: { notice: `${created.fullName} (${created.employeeCode}) was added.` },
          });
        }}
      />
    </section>
  );
}
