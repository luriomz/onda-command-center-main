import { EventPublicationStatus } from '@/types/events';

export const DEFAULT_EVENT_TIMEZONE = 'Africa/Maputo';

export const EVENT_TIMEZONE_OPTIONS = [
  'Africa/Maputo',
  'Africa/Johannesburg',
  'UTC',
  'Europe/Lisbon',
] as const;

export const EVENT_PUBLICATION_OPTIONS: Array<{
  value: Exclude<EventPublicationStatus, 'cancelled'>;
  label: string;
  description: string;
}> = [
  {
    value: 'draft',
    label: 'Draft',
    description: 'Save privately and keep refining the setup.',
  },
  {
    value: 'published',
    label: 'Published',
    description: 'Make the event ready for discovery and ticket sales.',
  },
];

export function toLocalDateTimeValue(iso?: string | null): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function localInputToIso(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function resolvePublicationStatus(
  lifecycleStatus?: string | null,
  publicationStatus?: EventPublicationStatus | null,
): Exclude<EventPublicationStatus, 'cancelled'> | 'cancelled' {
  if (publicationStatus) {
    return publicationStatus;
  }

  const normalized = (lifecycleStatus ?? '').toLowerCase();

  if (normalized === 'draft' || normalized === 'cancelled') {
    return normalized;
  }

  return 'published';
}
