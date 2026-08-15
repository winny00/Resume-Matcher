import { APPLICATION_STATUS_ORDER, type ApplicationStatus } from '@/lib/api/tracker';
import { safeStorage } from '@/lib/utils/resume-draft-storage';

export const TRACKER_VISIBLE_STATUSES_STORAGE_KEY = 'tracker_visible_statuses_v1';

const ALL_STATUSES = [...APPLICATION_STATUS_ORDER];
const STATUS_SET = new Set<ApplicationStatus>(APPLICATION_STATUS_ORDER);

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === 'string' && STATUS_SET.has(value as ApplicationStatus);
}

export function normalizeVisibleStatuses(value: unknown): ApplicationStatus[] {
  if (!Array.isArray(value)) {
    return [...ALL_STATUSES];
  }

  const requested = new Set(value.filter(isApplicationStatus));
  if (requested.size === 0) {
    return [...ALL_STATUSES];
  }

  return APPLICATION_STATUS_ORDER.filter((status) => requested.has(status));
}

export function readVisibleStatuses(): ApplicationStatus[] {
  const raw = safeStorage.get(TRACKER_VISIBLE_STATUSES_STORAGE_KEY);
  if (!raw) {
    return [...ALL_STATUSES];
  }

  try {
    return normalizeVisibleStatuses(JSON.parse(raw));
  } catch {
    return [...ALL_STATUSES];
  }
}

export function persistVisibleStatuses(statuses: ApplicationStatus[]): ApplicationStatus[] {
  const normalized = normalizeVisibleStatuses(statuses);
  safeStorage.set(TRACKER_VISIBLE_STATUSES_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function setStatusVisibility(
  current: ApplicationStatus[],
  status: ApplicationStatus,
  visible: boolean
): ApplicationStatus[] {
  const next = new Set(normalizeVisibleStatuses(current));

  if (visible) {
    next.add(status);
  } else if (next.size > 1) {
    next.delete(status);
  }

  return APPLICATION_STATUS_ORDER.filter((candidate) => next.has(candidate));
}
