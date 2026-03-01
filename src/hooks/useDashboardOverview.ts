import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import { DashboardOverview } from '@/types/dashboard';
import { useAuthStore } from '@/stores/authStore';

export function useDashboardOverview() {
  const org = useAuthStore((s) => s.org);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DashboardOverview>({
    queryKey: ['org-dashboard', 'overview', org?.id],
    queryFn: () => apiGet<DashboardOverview>('/org-dashboard/overview'),
    enabled: isAuthenticated && !!org,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Auto-refresh every 60s
  });
}
