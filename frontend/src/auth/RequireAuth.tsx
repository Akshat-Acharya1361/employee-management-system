import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export interface LoginRedirectState {
  /** Where to return after signing in, e.g. "/employees?status=ACTIVE" */
  from?: string;
}

/** Shows the protected pages only to a signed-in user; everyone else goes to /login. */
export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    const state: LoginRedirectState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
