'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while `onConfirm` runs. */
  pendingLabel?: string;
  variant?: 'default' | 'destructive';
  /** The dialog closes when this resolves. When it throws, the dialog stays open and shows the error. */
  onConfirm: () => void | Promise<void>;
}

/**
 * A confirmation step before an action. It behaves as an alert dialog: a click outside does not dismiss
 * it, and focus starts on Cancel, so pressing Enter does not confirm by accident.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const changeOpen = (next: boolean) => {
    if (isPending) return;
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = async () => {
    if (isPending) return;
    setIsPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete this action.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent role="alertdialog" className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="ghost" size="sm" disabled={isPending} onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button variant={variant} size="sm" disabled={isPending} onClick={() => void confirm()}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                {pendingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
