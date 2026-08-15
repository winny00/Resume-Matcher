'use client';

import React, { useMemo } from 'react';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslations } from '@/lib/i18n';
import type { Application } from '@/lib/api/tracker';

interface InterviewQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: Application[];
}

export function InterviewQuestionsDialog({
  open,
  onOpenChange,
  applications,
}: InterviewQuestionsDialogProps) {
  const { t } = useTranslations();

  const questions = useMemo(
    () =>
      applications.flatMap((application) =>
        (application.interview_questions ?? []).map((question) => ({
          ...question,
          application_id: application.application_id,
          company: application.company?.trim() || t('tracker.card.companyUnknown'),
          role: application.role?.trim() || t('tracker.card.roleUnknown'),
        }))
      ),
    [applications, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('tracker.interviewQuestions.title')}</DialogTitle>
          <DialogDescription>{t('tracker.interviewQuestions.description')}</DialogDescription>
        </DialogHeader>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareText className="h-8 w-8 text-steel-grey" />
            <p className="mt-3 font-serif text-lg text-ink">
              {t('tracker.interviewQuestions.emptyTitle')}
            </p>
            <p className="mt-1 max-w-md font-mono text-xs text-ink-soft">
              {t('tracker.interviewQuestions.emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {questions.map((item) => (
              <article
                key={`${item.application_id}:${item.id}`}
                className="border border-black bg-background p-3 shadow-sw-xs"
              >
                <div className="flex flex-col gap-1 border-b border-black pb-2 md:flex-row md:items-center md:justify-between">
                  <p className="font-mono text-xs font-bold uppercase tracking-wide text-primary">
                    {item.company}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                    {item.role}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{item.question}</p>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
