import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { verifyCredentials } from './authApi';
import {
  clearSession,
  encodeBasicCredentials,
  getSession,
  saveSession,
  SESSION_EXPIRED_EVENT,
  type AuthSession,
} from './session';

interface AuthContextValue {
  session: AuthSession | null;
  /** True when the user was signed out because the server rejected the stored credentials. */
  sessionExpired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(getSession);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setSession(null);
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const authorization = encodeBasicCredentials(username, password);
    const currentUser = await verifyCredentials(authorization);
    const newSession = { username: currentUser.username, authorization };
    saveSession(newSession);
    setSession(newSession);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setSessionExpired(false);
  }, []);

  const value = useMemo(() => ({ session, sessionExpired, login, logout }), [session, sessionExpired, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
