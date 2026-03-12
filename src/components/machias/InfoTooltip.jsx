import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Small ⓘ icon that opens a modal with contextual narrative.
 * `title` — dialog heading
 * `children` — rich content (JSX or string)
 */
export default function InfoTooltip({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-4 w-4 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 flex-shrink-0"
        aria-label="Learn more"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3 mt-1">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}