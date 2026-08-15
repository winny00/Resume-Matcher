import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InterviewQuestionsDialog } from '@/components/tracker/interview-questions-dialog';
import type { Application } from '@/lib/api/tracker';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

function application(overrides: Partial<Application>): Application {
  return {
    application_id: 'app-1',
    job_id: 'job-1',
    resume_id: 'res-1',
    master_resume_id: null,
    status: 'interview',
    company: 'Acme Corp',
    role: 'Staff Engineer',
    applied_at: null,
    interview_at: null,
    notes: null,
    interview_questions: [],
    position: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('InterviewQuestionsDialog', () => {
  it('shows recorded questions with their company source', () => {
    render(
      <InterviewQuestionsDialog
        open
        onOpenChange={vi.fn()}
        applications={[
          application({
            interview_questions: [
              {
                id: 'q1',
                question: 'Tell me about a complex project.',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
              },
            ],
          }),
        ]}
      />
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tell me about a complex project.')).toBeInTheDocument();
  });

  it('falls back when the source company is missing', () => {
    render(
      <InterviewQuestionsDialog
        open
        onOpenChange={vi.fn()}
        applications={[
          application({
            company: null,
            role: null,
            interview_questions: [
              {
                id: 'q1',
                question: 'Why this role?',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
              },
            ],
          }),
        ]}
      />
    );

    expect(screen.getByText('tracker.card.companyUnknown')).toBeInTheDocument();
    expect(screen.getByText('tracker.card.roleUnknown')).toBeInTheDocument();
  });

  it('closes through the dialog close button', () => {
    const onOpenChange = vi.fn();
    render(<InterviewQuestionsDialog open onOpenChange={onOpenChange} applications={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
