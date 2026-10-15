import { Link } from 'react-router-dom';

export function NotFoundPanel({ message = 'This employee does not exist or has been deleted.' }: { message?: string }) {
  return (
    <div className="state-panel" role="alert">
      <h1>Not found</h1>
      <p>{message}</p>
      <Link to="/employees" className="button button--secondary">Back to employees</Link>
    </div>
  );
}
