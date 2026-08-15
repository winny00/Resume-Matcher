'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { useTranslations } from '@/lib/i18n';
import { APPLICATION_STATUS_ORDER, type ApplicationStatus } from '@/lib/api/tracker';
import { setStatusVisibility } from './status-visibility';

interface StatusVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleStatuses: ApplicationStatus[];
  onVisibleStatusesChange: (statuses: ApplicationStatus[]) => void;
}

export function StatusVisibilityDialog({
  open,
  onOpenChange,
  visibleStatuses,
  onVisibleStatusesChange,
}: StatusVisibilityDialogProps) {
  const { t } = useTranslations();
  const visibleSet = useMemo(() => new Set(visibleStatuses), [visibleStatuses]);

  const handleToggle = (status: ApplicationStatus, checked: boolean) => {
    onVisibleStatusesChange(setStatusVisibility(visibleStatuses, status, checked));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('tracker.manage.title')}</DialogTitle>
          <DialogDescription>{t('tracker.manage.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {APPLICATION_STATUS_ORDER.map((status) => {
            const checked = visibleSet.has(status);
            const disabled = checked && visibleStatuses.length === 1;
            return (
              <ToggleSwitch
                key={status}
                checked={checked}
                onCheckedChange={(nextChecked) => handleToggle(status, nextChecked)}
                label={t(`tracker.columns.${status}`)}
                description={disabled ? t('tracker.manage.lastVisible') : undefined}
                disabled={disabled}
              />
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
