import { API_BASE_URL, ApiRequestError, toApiRequestError } from '../api/employeeApi';

/**
 * Checks a username and password against GET /api/auth/me without storing them.
 * HTTP Basic has no separate login call, so a 200 here means the credentials are valid.
 */
export async function verifyCredentials(authorization: string): Promise<{ username: string }> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Accept: 'application/json', Authorization: authorization },
    });
  } catch {
    throw new ApiRequestError(0, `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`);
  }
  if (response.status === 401) throw new ApiRequestError(401, 'Invalid username or password');
  if (!response.ok) throw await toApiRequestError(response);
  return (await response.json()) as { username: string };
}
