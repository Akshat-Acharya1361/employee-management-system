import { employeeApi } from '../api/employeeApi';
import { DEFAULT_LIST_QUERY } from '../pages/listQuery';
import { clearSession, encodeBasicCredentials, getSession, saveSession, SESSION_EXPIRED_EVENT } from './session';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('encodeBasicCredentials', () => {
  it('builds a standard HTTP Basic header', () => {
    expect(encodeBasicCredentials('admin', 'admin123')).toBe('Basic YWRtaW46YWRtaW4xMjM=');
  });

  it('encodes non-ASCII characters as UTF-8', () => {
    expect(encodeBasicCredentials('admin', 'pässwörd')).toBe(`Basic ${btoa('admin:pÃ¤sswÃ¶rd')}`);
  });
});

describe('API requests and the stored session', () => {
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('sends the Authorization header of the signed-in user', async () => {
    saveSession({ username: 'admin', authorization: 'Basic abc' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(['Engineering']));
    vi.stubGlobal('fetch', fetchMock);

    await employeeApi.listDepartments();

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Basic abc');
  });

  it('survives a page refresh through sessionStorage', () => {
    saveSession({ username: 'admin', authorization: 'Basic abc' });
    expect(JSON.parse(window.sessionStorage.getItem('ems.session')!)).toEqual({
      username: 'admin',
      authorization: 'Basic abc',
    });
  });

  it('clears the session and announces it when the API answers 401', async () => {
    saveSession({ username: 'admin', authorization: 'Basic stale' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 401, message: 'Invalid or missing username and password' }, 401)));
    const expiredListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);

    await expect(employeeApi.list(DEFAULT_LIST_QUERY)).rejects.toMatchObject({ status: 401 });

    expect(getSession()).toBeNull();
    expect(window.sessionStorage.getItem('ems.session')).toBeNull();
    expect(expiredListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, expiredListener);
  });
});
