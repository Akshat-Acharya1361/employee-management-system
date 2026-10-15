import type { EmploymentStatus } from '../api/types';
import { formatStatus } from '../utils/format';

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{formatStatus(status)}</span>;
}
