/**
 * The signed-in administrator's HTTP Basic credentials.
 *
 * Kept in memory and mirrored to sessionStorage, so a page refresh keeps you signed in but closing
 * the tab signs you out. Storage can be unavailable (private windows, blocked site data), so every
 * access is wrapped and the in-memory copy still works on its own.
 */
export interface AuthSession {
  username: string;
  /** Full Authorization header value, e.g. "Basic YWRtaW46YWRtaW4xMjM=" */
  authorization: string;
}

const STORAGE_KEY = 'ems.session';

/** Fired on window when the API rejects the stored credentials (401). */
export const SESSION_EXPIRED_EVENT = 'ems:session-expired';

let currentSession: AuthSession | null = readStoredSession();

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof (parsed as AuthSession).username === 'string' &&
      typeof (parsed as AuthSession).authorization === 'string'
    ) {
      return parsed as AuthSession;
    }
  } catch {
    // Unreadable or blocked storage: start signed out.
  }
  return null;
}

export function getSession(): AuthSession | null {
  return currentSession;
}

export function saveSession(session: AuthSession): void {
  currentSession = session;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Still signed in for this page load.
  }
}

export function clearSession(): void {
  currentSession = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to clear.
  }
}

/** Builds "Basic base64(username:password)" using UTF-8, so non-ASCII passwords work. */
export function encodeBasicCredentials(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${btoa(binary)}`;
}
