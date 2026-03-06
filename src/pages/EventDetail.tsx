import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Calendar,
  Clock3,
  Edit3,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  RadioTower,
  Save,
  ScanLine,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEventDetail } from '@/hooks/useEventDetail';
import { apiDelete, apiPatch } from '@/lib/apiClient';
import {
  DEFAULT_EVENT_TIMEZONE,
  EVENT_TIMEZONE_OPTIONS,
  isValidUrl,
  localInputToIso,
  resolvePublicationStatus,
  toLocalDateTimeValue,
  trimToUndefined,
} from '@/lib/eventManagement';
import { isLiveEventStatus } from '@/lib/eventRouting';
import { useAuthStore } from '@/stores/authStore';
import {
  EventDetail as EventDetailModel,
  EventListItem,
  EventPublicationStatus,
  UpdateEventRequest,
} from '@/types/events';

interface EditFormState {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  capacity: string;
  status: EventPublicationStatus;
  timezone: string;
  coverImageUrl: string;
}

const MANAGEMENT_STATUS_OPTIONS: Array<{
  value: EventPublicationStatus;
  label: string;
}> = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return 'Schedule unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function getStatusBadgeClassName(status?: string): string {
  const normalized = (status ?? '').toLowerCase();

  switch (normalized) {
    case 'active':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    case 'published':
    case 'upcoming':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'past':
      return 'border-white/[0.08] bg-white/[0.04] text-muted-foreground';
    case 'cancelled':
      return 'border-red-400/20 bg-red-400/10 text-red-300';
    case 'draft':
      return 'border-white/[0.08] bg-white/[0.04] text-muted-foreground';
    default:
      return 'border-white/[0.08] bg-white/[0.04] text-muted-foreground';
  }
}

function buildEditFormState(event: EventDetailModel): EditFormState {
  return {
    name: event.name,
    description: event.description ?? '',
    startTime: toLocalDateTimeValue(event.start_time),
    endTime: toLocalDateTimeValue(event.end_time),
    capacity: event.capacity > 0 ? String(event.capacity) : '',
    status: resolvePublicationStatus(event.status, event.publication_status),
    timezone: event.timezone ?? DEFAULT_EVENT_TIMEZONE,
    coverImageUrl: event.cover_image_url ?? '',
  };
}

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const org = useAuthStore((s) => s.org);
  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useEventDetail(eventId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    capacity: '',
    status: 'draft',
    timezone: DEFAULT_EVENT_TIMEZONE,
    coverImageUrl: '',
  });

  const canEdit = org?.role === 'admin' || org?.role === 'organizer';

  const soldCount = useMemo(() => {
    if (!event) {
      return 0;
    }

    return event.revenue?.tickets_sold ?? event.ticket_types.reduce(
      (sum, ticketType) => sum + ticketType.quantity_sold,
      0,
    );
  }, [event]);

  const capacityPercentage = useMemo(() => {
    if (!event || event.capacity <= 0) {
      return 0;
    }

    return Math.min(100, (soldCount / event.capacity) * 100);
  }, [event, soldCount]);

  const timezoneOptions = useMemo(() => {
    const options = new Set<string>(EVENT_TIMEZONE_OPTIONS);

    if (editForm.timezone.trim()) {
      options.add(editForm.timezone.trim());
    }

    return Array.from(options);
  }, [editForm.timezone]);

  const updateEventMutation = useMutation({
    mutationFn: async (payload: UpdateEventRequest) => {
      return apiPatch<EventListItem, UpdateEventRequest>(
        `/events/${eventId}`,
        payload,
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['org-dashboard'] }),
      ]);

      setIsEditOpen(false);
      toast({
        title: 'Event updated',
        description: 'The latest event details have been saved.',
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: 'Update failed',
        description: mutationError.message,
        variant: 'destructive',
      });
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: async () => apiDelete(`/events/${eventId}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['org-dashboard'] }),
      ]);

      toast({
        title: 'Event cancelled',
        description: 'The event is now marked as cancelled.',
      });
      navigate('/events');
    },
    onError: (mutationError: Error) => {
      toast({
        title: 'Cancellation failed',
        description: mutationError.message,
        variant: 'destructive',
      });
    },
  });

  const openEditDialog = () => {
    if (!event) {
      return;
    }

    setEditForm(buildEditFormState(event));
    setIsEditOpen(true);
  };

  const submitEdit = (inputEvent: FormEvent<HTMLFormElement>) => {
    inputEvent.preventDefault();

    if (!eventId || !event) {
      return;
    }

    const name = editForm.name.trim();

    if (!name) {
      toast({
        title: 'Name required',
        description: 'Event name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const nextStartTime = localInputToIso(editForm.startTime);
    const nextEndTime = localInputToIso(editForm.endTime);

    if (!nextStartTime || !nextEndTime) {
      toast({
        title: 'Invalid schedule',
        description: 'Both start and end times must be valid.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(nextEndTime).getTime() <= new Date(nextStartTime).getTime()) {
      toast({
        title: 'Invalid schedule',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
      return;
    }

    let capacity: number | undefined;
    const rawCapacity = editForm.capacity.trim();

    if (rawCapacity) {
      const parsedCapacity = Number(rawCapacity);

      if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
        toast({
          title: 'Invalid capacity',
          description: 'Capacity must be a positive whole number.',
          variant: 'destructive',
        });
        return;
      }

      capacity = parsedCapacity;
    } else if (event.capacity > 0) {
      toast({
        title: 'Capacity required',
        description:
          'Set a positive capacity here. Removing an existing limit is not supported from this dialog yet.',
        variant: 'destructive',
      });
      return;
    }

    const coverImageUrl = trimToUndefined(editForm.coverImageUrl);

    if (coverImageUrl && !isValidUrl(coverImageUrl)) {
      toast({
        title: 'Invalid cover image URL',
        description: 'Use a full URL starting with http:// or https://.',
        variant: 'destructive',
      });
      return;
    }

    updateEventMutation.mutate({
      name,
      description: trimToUndefined(editForm.description),
      start_time: nextStartTime,
      end_time: nextEndTime,
      capacity,
      status: editForm.status,
      timezone: trimToUndefined(editForm.timezone) ?? DEFAULT_EVENT_TIMEZONE,
      cover_image_url: coverImageUrl,
    });
  };

  return (
    <AuthGuard>
      <AppShell>
        {!eventId && (
          <div className="glass-panel p-6 text-sm text-destructive">
            Missing event id in route.
          </div>
        )}

        {eventId && isLoading && (
          <div className="glass-panel p-6 text-sm text-muted-foreground">
            Loading event detail...
          </div>
        )}

        {eventId && isError && (
          <div className="glass-panel p-6 text-sm text-destructive">
            Unable to load event detail: {error?.message}
          </div>
        )}

        {eventId && event && (
          <>
            <motion.div
              className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="space-y-3">
                <div className="glass-pill w-fit text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Event Detail
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                      {event.name}
                    </h1>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClassName(
                        event.status,
                      )}`}
                    >
                      {event.status ?? 'unknown'}
                    </span>
                    {isLiveEventStatus(event.status) && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Live now
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {event.description}
                    </p>
                  )}

                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                    <div className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDateTime(event.start_time)}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Ends {formatDateTime(event.end_time)}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-primary" />
                      {event.timezone ?? DEFAULT_EVENT_TIMEZONE}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {event.venue_name ?? 'Venue TBD'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={openEditDialog}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Event
                  </button>
                )}

                {canEdit && event.publication_status !== 'cancelled' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-400/15"
                      >
                        <Ban className="h-4 w-4" />
                        Cancel Event
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-white/[0.08] bg-card/95 text-foreground backdrop-blur-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This uses the dashboard cancel flow and marks the event
                          as cancelled. The current detail view will close after
                          the request succeeds.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className="border-white/[0.08] bg-white/[0.03] text-foreground hover:bg-white/[0.06]"
                          disabled={cancelEventMutation.isPending}
                        >
                          Keep Event
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelEventMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={cancelEventMutation.isPending}
                        >
                          {cancelEventMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="mr-2 h-4 w-4" />
                          )}
                          Cancel Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isLiveEventStatus(event.status) && (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <RadioTower className="h-4 w-4" />
                    View Live
                  </button>
                )}
              </div>
            </motion.div>

            {event.cover_image_url && (
              <motion.section
                className="glass-panel mb-6 overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
              >
                <div
                  className="h-44 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(8, 12, 18, 0.08), rgba(8, 12, 18, 0.72)), url(${event.cover_image_url})`,
                  }}
                />
                <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="data-label">Cover image</p>
                    <p className="text-sm text-muted-foreground">
                      This event already has a linked marketing image.
                    </p>
                  </div>
                  <a
                    href={event.cover_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open image
                  </a>
                </div>
              </motion.section>
            )}

            <motion.div
              className="glass-panel mb-6 p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="data-label">Capacity</p>
                  <p className="data-value">
                    {soldCount.toLocaleString()}
                    {event.capacity > 0 ? (
                      <span className="text-muted-foreground">
                        /{event.capacity.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">/Uncapped</span>
                    )}
                  </p>
                </div>
                <span className="glass-pill text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {event.capacity > 0
                    ? `${formatPercent(capacityPercentage)} sold`
                    : 'No limit'}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-emerald-300 transition-all"
                  style={{ width: `${event.capacity > 0 ? capacityPercentage : 100}%` }}
                />
              </div>
            </motion.div>

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <motion.section
                className="glass-panel overflow-hidden"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
              >
                <div className="border-b border-white/[0.06] px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Ticket Types
                    </h2>
                  </div>
                </div>

                {event.ticket_types.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    No ticket types configured for this event.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.06] hover:bg-transparent">
                        <TableHead className="text-xs text-muted-foreground">
                          Type
                        </TableHead>
                        <TableHead className="text-right text-xs text-muted-foreground">
                          Price
                        </TableHead>
                        <TableHead className="text-right text-xs text-muted-foreground">
                          Sold
                        </TableHead>
                        <TableHead className="text-right text-xs text-muted-foreground">
                          Remaining
                        </TableHead>
                        <TableHead className="text-right text-xs text-muted-foreground">
                          Sell-through
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {event.ticket_types.map((ticketType) => {
                        const totalInventory =
                          ticketType.quantity_sold + ticketType.quantity_remaining;
                        const sellThrough =
                          totalInventory > 0
                            ? (ticketType.quantity_sold / totalInventory) * 100
                            : 0;

                        return (
                          <TableRow
                            key={ticketType.id}
                            className="border-white/[0.06] hover:bg-white/[0.02]"
                          >
                            <TableCell className="font-medium text-foreground">
                              {ticketType.name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-gold">
                              {formatCurrency(ticketType.price)} MZN
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-foreground">
                              {ticketType.quantity_sold.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                              {ticketType.quantity_remaining.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-primary">
                              {formatPercent(sellThrough)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </motion.section>

              <div className="space-y-6">
                <motion.section
                  className="glass-panel p-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.3 }}
                >
                  <div className="mb-5 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Revenue Summary
                    </h2>
                  </div>

                  {event.revenue ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Actual Revenue</p>
                        <p className="mt-2 font-mono text-xl font-semibold text-foreground">
                          {formatCurrency(event.revenue.actual_mzn)} MZN
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Projected Revenue</p>
                        <p className="mt-2 font-mono text-xl font-semibold text-amber-300">
                          {formatCurrency(event.revenue.projected_mzn)} MZN
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Avg Ticket Price</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                          {formatCurrency(event.revenue.average_ticket_price)} MZN
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Tickets Sold</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                          {event.revenue.tickets_sold.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Refunds</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-red-300">
                          {formatCurrency(event.revenue.refunds)} MZN
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Fees</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-muted-foreground">
                          {formatCurrency(event.revenue.fees)} MZN
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Revenue enrichment is unavailable right now. Core event
                      metadata is still loaded.
                    </p>
                  )}
                </motion.section>

                <motion.section
                  className="glass-panel p-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 }}
                >
                  <div className="mb-5 flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Check-in Summary
                    </h2>
                  </div>

                  {event.check_in_stats ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="data-label">Total Scanned</p>
                        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
                          {event.check_in_stats.total_scanned.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {event.check_in_stats.by_type.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No scan breakdown available.
                          </p>
                        ) : (
                          event.check_in_stats.by_type.map((entry) => (
                            <div
                              key={entry.type}
                              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                            >
                              <span className="text-sm font-medium capitalize text-foreground">
                                {entry.type.replace(/_/g, ' ')}
                              </span>
                              <span className="font-mono text-sm text-primary">
                                {entry.count.toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Check-in enrichment is unavailable right now. Event detail
                      is still accessible.
                    </p>
                  )}
                </motion.section>
              </div>
            </div>
          </>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-card/95 text-foreground backdrop-blur-xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update scheduling, publishing, and presentation fields exposed by
                the dashboard API.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-6" onSubmit={submitEdit}>
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
                <section className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="event-name"
                      className="text-sm font-medium text-foreground"
                    >
                      Event Name
                    </label>
                    <Input
                      id="event-name"
                      value={editForm.name}
                      onChange={(inputEvent) =>
                        setEditForm((current) => ({
                          ...current,
                          name: inputEvent.target.value,
                        }))
                      }
                      className="border-white/[0.08] bg-white/[0.03]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="event-description"
                      className="text-sm font-medium text-foreground"
                    >
                      Description
                    </label>
                    <Textarea
                      id="event-description"
                      value={editForm.description}
                      onChange={(inputEvent) =>
                        setEditForm((current) => ({
                          ...current,
                          description: inputEvent.target.value,
                        }))
                      }
                      className="border-white/[0.08] bg-white/[0.03]"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="event-start"
                        className="text-sm font-medium text-foreground"
                      >
                        Start Time
                      </label>
                      <Input
                        id="event-start"
                        type="datetime-local"
                        value={editForm.startTime}
                        onChange={(inputEvent) =>
                          setEditForm((current) => ({
                            ...current,
                            startTime: inputEvent.target.value,
                          }))
                        }
                        className="border-white/[0.08] bg-white/[0.03]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="event-end"
                        className="text-sm font-medium text-foreground"
                      >
                        End Time
                      </label>
                      <Input
                        id="event-end"
                        type="datetime-local"
                        value={editForm.endTime}
                        onChange={(inputEvent) =>
                          setEditForm((current) => ({
                            ...current,
                            endTime: inputEvent.target.value,
                          }))
                        }
                        className="border-white/[0.08] bg-white/[0.03]"
                        required
                      />
                    </div>
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="event-status"
                      className="text-sm font-medium text-foreground"
                    >
                      Status
                    </label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value: EventPublicationStatus) =>
                        setEditForm((current) => ({
                          ...current,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="event-status"
                        className="border-white/[0.08] bg-white/[0.03]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGEMENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="event-timezone"
                      className="text-sm font-medium text-foreground"
                    >
                      Timezone
                    </label>
                    <Select
                      value={editForm.timezone}
                      onValueChange={(value) =>
                        setEditForm((current) => ({
                          ...current,
                          timezone: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="event-timezone"
                        className="border-white/[0.08] bg-white/[0.03]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="event-capacity"
                      className="text-sm font-medium text-foreground"
                    >
                      Capacity
                    </label>
                    <Input
                      id="event-capacity"
                      type="number"
                      min={1}
                      step={1}
                      value={editForm.capacity}
                      onChange={(inputEvent) =>
                        setEditForm((current) => ({
                          ...current,
                          capacity: inputEvent.target.value,
                        }))
                      }
                      className="border-white/[0.08] bg-white/[0.03]"
                      placeholder={event?.capacity > 0 ? undefined : 'Optional'}
                    />
                    <p className="text-xs text-muted-foreground">
                      {event?.capacity > 0
                        ? 'Use a positive whole number here. Removing an existing cap is not supported yet.'
                        : 'Leave blank to keep this event uncapped.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="event-cover-image"
                      className="text-sm font-medium text-foreground"
                    >
                      Cover Image URL
                    </label>
                    <Input
                      id="event-cover-image"
                      type="url"
                      value={editForm.coverImageUrl}
                      onChange={(inputEvent) =>
                        setEditForm((current) => ({
                          ...current,
                          coverImageUrl: inputEvent.target.value,
                        }))
                      }
                      className="border-white/[0.08] bg-white/[0.03]"
                      placeholder="https://..."
                    />
                  </div>
                </aside>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  disabled={updateEventMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={updateEventMutation.isPending}
                >
                  {updateEventMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppShell>
    </AuthGuard>
  );
};

export default EventDetail;
