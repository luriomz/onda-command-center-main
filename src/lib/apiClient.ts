import { useAuthStore } from '@/stores/authStore';

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
    headers.set('X-Org-Id', org.id);
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
