import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { CreateEventRequest, EventListItem } from '@/types/events';

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventRequest) =>
      apiPost<EventListItem, CreateEventRequest>('/events', payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['org-dashboard'] }),
      ]);
    },
  });
}
