import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient(url: string, options: RequestOptions = {}): Promise<Response> {
  const { accessToken, org, refreshTokens, logout } = useAuthStore.getState();
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (org) {
    headers.set('X-Organization-ID', org.id);
  }

  let response = await fetch(url, { ...fetchOptions, headers });

  // Intercept 401 → refresh once → retry
  if (response.status === 401 && !skipAuth) {
    const refreshed = refreshTokens();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...fetchOptions, headers });
    } else {
      logout();
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiClient(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
  return response.json();
}
