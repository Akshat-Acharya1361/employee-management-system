import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiRequestError } from '../api/employeeApi';
import { EMPTY_EMPLOYEE_INPUT, EmployeeForm } from './EmployeeForm';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Employee ID'), 'EMP-016');
  await user.type(screen.getByLabelText('Full name'), 'Riya Kapoor');
  await user.type(screen.getByLabelText('Email address'), 'riya@example.com');
  await user.type(screen.getByLabelText('Phone number'), '+91 98260 12345');
  await user.type(screen.getByLabelText('Department'), 'Engineering');
  await user.type(screen.getByLabelText('Designation'), 'Software Engineer');
  await user.type(screen.getByLabelText('Date of joining'), '2024-09-02');
  await user.type(screen.getByLabelText('Annual salary (INR)'), '750000');
}

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <EmployeeForm mode="create" initialValues={EMPTY_EMPLOYEE_INPUT} cancelHref="/employees" onSubmit={onSubmit} />
    </MemoryRouter>,
  );
  return onSubmit;
}

describe('EmployeeForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(['Engineering', 'Sales'])));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows field errors and does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add employee' }));

    expect(screen.getByText('Employee ID is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Employee ID')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Employee ID')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values and blocks a second click while saving', async () => {
    const user = userEvent.setup();
    let finishSave: () => void = () => {};
    const onSubmit = renderForm(vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; })));

    await fillValidForm(user);
    const submitButton = screen.getByRole('button', { name: 'Add employee' });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Saving…' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      employeeCode: 'EMP-016',
      email: 'riya@example.com',
      salary: '750000',
      status: 'ACTIVE',
    }));
    finishSave();
  });

  it('shows duplicate errors returned by the API next to the field', async () => {
    const user = userEvent.setup();
    renderForm(vi.fn().mockRejectedValue(
      new ApiRequestError(409, 'An employee with email riya@example.com already exists', {
        email: 'An employee with email riya@example.com already exists',
      }),
    ));

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Add employee' }));

    await waitFor(() => expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('An employee with email riya@example.com already exists')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.');
    expect(screen.getByRole('button', { name: 'Add employee' })).toBeEnabled();
  });
});
