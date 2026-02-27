import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LoginScreen } from './LoginScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenExpiresAt = useAuthStore((s) => s.tokenExpiresAt);
  const refreshTokens = useAuthStore((s) => s.refreshTokens);

  // Auto-refresh tokens before expiry
  useEffect(() => {
    if (!isAuthenticated || !tokenExpiresAt) return;

    const checkAndRefresh = () => {
      const timeLeft = tokenExpiresAt - Date.now();
      if (timeLeft < 2 * 60 * 1000) {
        // Less than 2 minutes left
        refreshTokens();
      }
    };

    const interval = setInterval(checkAndRefresh, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, tokenExpiresAt, refreshTokens]);

  if (!isAuthenticated) return <LoginScreen />;

  return <>{children}</>;
};
