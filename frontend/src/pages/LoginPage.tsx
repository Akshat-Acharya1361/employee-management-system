import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../api/employeeApi';
import { useAuth } from '../auth/AuthContext';
import type { LoginRedirectState } from '../auth/RequireAuth';

/** Only redirect to pages inside this app, never to another site. */
function safeReturnPath(from: string | undefined): string {
  return from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/employees';
}

export function LoginPage() {
  const { session, sessionExpired, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = safeReturnPath((location.state as LoginRedirectState | null)?.from);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (session && !submitting) return <Navigate to={returnPath} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!username.trim() || !password) {
      setErrorMessage('Enter your username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(username.trim(), password);
      navigate(returnPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiRequestError ? error.message : 'Could not sign in. Please try again.');
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <section className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Sign in</h1>
        <p className="login__subtitle">Administrator access to employee records.</p>

        {sessionExpired && !errorMessage && (
          <p className="notice notice--info" role="status">Your session has ended. Please sign in again.</p>
        )}
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit" className="button button--primary login__submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        {import.meta.env.DEV && (
          <p className="field__hint login__hint">
            Local development default: <code>admin</code> / <code>admin123</code> (change with EMS_ADMIN_USERNAME and
            EMS_ADMIN_PASSWORD).
          </p>
        )}
      </form>
    </section>
  );
}
