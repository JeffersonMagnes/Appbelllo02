'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Presentation shell for the existing agenda dialogs. */
export function ModalFrame({ title, onClose, className, children }: {
  title: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent
      aria-describedby={undefined}
      onInteractOutside={(event) => event.preventDefault()}
      className={cn('gap-0 p-0 sm:p-0 [&>button]:hidden', className)}>
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {children}
    </DialogContent>
  </Dialog>;
}
