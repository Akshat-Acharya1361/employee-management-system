import { useEffect, useState } from 'react';
import { ApiRequestError, employeeApi, isAbortError } from '../api/employeeApi';
import type { Employee } from '../api/types';

export type EmployeeLoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; employee: Employee };

/** Loads one employee by the numeric id in the URL; shared by the details and edit pages. */
export function useEmployee(idParam: string | undefined, reloadToken = 0): EmployeeLoadState {
  const [state, setState] = useState<EmployeeLoadState>({ kind: 'loading' });

  useEffect(() => {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      setState({ kind: 'not-found' });
      return;
    }

    const controller = new AbortController();
    setState({ kind: 'loading' });
    employeeApi
      .get(id, controller.signal)
      .then((employee) => setState({ kind: 'loaded', employee }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (error instanceof ApiRequestError && error.status === 404) setState({ kind: 'not-found' });
        else setState({ kind: 'error', message: error instanceof Error ? error.message : 'Could not load the employee' });
      });
    return () => controller.abort();
  }, [idParam, reloadToken]);

  return state;
}
