import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface FlashState {
  notice?: string;
}

/**
 * Shows a one-time success message passed through router state, e.g. after
 * creating an employee. The state is cleared so a refresh does not repeat it.
 */
export function FlashNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const flashState = location.state as FlashState | null;
    if (flashState?.notice) {
      setNotice(flashState.notice);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  if (!notice) return null;

  return (
    <div className="notice notice--success" role="status">
      <span>{notice}</span>
      <button type="button" className="notice__dismiss" onClick={() => setNotice(null)} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}
