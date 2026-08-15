import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KanbanBoard } from '@/components/tracker/kanban-board';
import {
  normalizeVisibleStatuses,
  persistVisibleStatuses,
  readVisibleStatuses,
  setStatusVisibility,
  TRACKER_VISIBLE_STATUSES_STORAGE_KEY,
} from '@/components/tracker/status-visibility';
import {
  APPLICATION_STATUS_ORDER,
  bulkDeleteApplications,
  bulkUpdateStatus,
  listApplications,
  updateApplication,
  type Application,
  type ApplicationColumns,
  type ApplicationStatus,
} from '@/lib/api/tracker';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params?.count === undefined ? key : `${key} ${params.count}`,
  }),
}));

vi.mock('@/components/tracker/card-detail-modal', () => ({
  CardDetailModal: () => null,
}));

vi.mock('@/lib/api/tracker', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/tracker')>();
  return {
    ...actual,
    listApplications: vi.fn(),
    updateApplication: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    bulkDeleteApplications: vi.fn(),
  };
});

const listApplicationsMock = vi.mocked(listApplications);
const updateApplicationMock = vi.mocked(updateApplication);
const bulkUpdateStatusMock = vi.mocked(bulkUpdateStatus);
const bulkDeleteApplicationsMock = vi.mocked(bulkDeleteApplications);

function card(id: string, status: ApplicationStatus, company: string): Application {
  return {
    application_id: id,
    job_id: `job-${id}`,
    resume_id: `res-${id}`,
    master_resume_id: null,
    status,
    company,
    role: `${company} role`,
    applied_at: null,
    interview_at: null,
    notes: null,
    position: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function emptyColumns(): ApplicationColumns {
  return APPLICATION_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as ApplicationColumns);
}

function seededColumns(): ApplicationColumns {
  return {
    ...emptyColumns(),
    saved: [card('saved-1', 'saved', 'Saved Co')],
    interview: [card('interview-1', 'interview', 'Interview Co')],
    rejected: [card('rejected-1', 'rejected', 'Rejected Co')],
  };
}

async function renderBoard() {
  render(<KanbanBoard />);
  await screen.findByText('Saved Co');
}

function closeStatusDialog() {
  fireEvent.click(
    within(screen.getByRole('dialog')).getAllByRole('button', { name: 'common.close' })[0]
  );
}

describe('tracker status visibility storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to every tracker status when storage is empty or invalid', () => {
    expect(readVisibleStatuses()).toEqual(APPLICATION_STATUS_ORDER);

    localStorage.setItem(TRACKER_VISIBLE_STATUSES_STORAGE_KEY, 'not-json');
    expect(readVisibleStatuses()).toEqual(APPLICATION_STATUS_ORDER);

    localStorage.setItem(TRACKER_VISIBLE_STATUSES_STORAGE_KEY, JSON.stringify([]));
    expect(readVisibleStatuses()).toEqual(APPLICATION_STATUS_ORDER);
  });

  it('keeps only known statuses, dedupes them, and restores canonical order', () => {
    localStorage.setItem(
      TRACKER_VISIBLE_STATUSES_STORAGE_KEY,
      JSON.stringify(['rejected', 'ghost', 'applied', 'applied'])
    );

    expect(readVisibleStatuses()).toEqual(['applied', 'rejected']);
    expect(normalizeVisibleStatuses(['interview', 'saved'])).toEqual(['saved', 'interview']);
  });

  it('does not allow toggling off the last visible status', () => {
    const next = setStatusVisibility(['saved'], 'saved', false);
    expect(next).toEqual(['saved']);

    persistVisibleStatuses(next);
    expect(JSON.parse(localStorage.getItem(TRACKER_VISIBLE_STATUSES_STORAGE_KEY)!)).toEqual([
      'saved',
    ]);
  });
});

describe('KanbanBoard status management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    listApplicationsMock.mockResolvedValue({ columns: seededColumns() });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders every status by default, then hides and restores a status without deleting data', async () => {
    await renderBoard();

    expect(screen.getByRole('heading', { name: 'tracker.columns.saved' })).toBeInTheDocument();
    expect(screen.getByText('Saved Co')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'tracker.manage.button' }));
    fireEvent.click(screen.getByRole('switch', { name: 'tracker.columns.saved' }));
    closeStatusDialog();

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'tracker.columns.saved' })).toBeNull();
    });
    expect(screen.queryByText('Saved Co')).toBeNull();
    expect(updateApplicationMock).not.toHaveBeenCalled();
    expect(bulkDeleteApplicationsMock).not.toHaveBeenCalled();
    expect(bulkUpdateStatusMock).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(TRACKER_VISIBLE_STATUSES_STORAGE_KEY)!)).not.toContain(
      'saved'
    );

    fireEvent.click(screen.getByRole('button', { name: 'tracker.manage.button' }));
    fireEvent.click(screen.getByRole('switch', { name: 'tracker.columns.saved' }));
    closeStatusDialog();

    expect(
      await screen.findByRole('heading', { name: 'tracker.columns.saved' })
    ).toBeInTheDocument();
    expect(screen.getByText('Saved Co')).toBeInTheDocument();
  });

  it('uses a saved visibility preference after mounting', async () => {
    localStorage.setItem(TRACKER_VISIBLE_STATUSES_STORAGE_KEY, JSON.stringify(['interview']));
    render(<KanbanBoard />);

    expect(await screen.findByText('Interview Co')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'tracker.columns.saved' })).toBeNull();
    });
    expect(screen.getByRole('heading', { name: 'tracker.columns.interview' })).toBeInTheDocument();
    expect(screen.queryByText('Saved Co')).toBeNull();
  });

  it('clears selected hidden cards so bulk actions cannot target invisible cards', async () => {
    await renderBoard();

    fireEvent.click(screen.getAllByLabelText('tracker.card.selectAria')[0]);
    expect(screen.getByText('tracker.bulk.selected 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'tracker.manage.button' }));
    fireEvent.click(screen.getByRole('switch', { name: 'tracker.columns.saved' }));
    closeStatusDialog();

    await waitFor(() => {
      expect(screen.queryByText('tracker.bulk.selected 1')).toBeNull();
    });
  });
});
