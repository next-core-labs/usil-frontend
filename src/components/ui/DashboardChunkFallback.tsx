import React from 'react';
import { UsilMark } from '../UsilMark';

/**
 * Shown while a lazily-loaded dashboard chunk is fetched. Full-bleed and
 * branded, because the alternative on a slow connection is a white page with
 * no explanation of what is happening.
 */
export function DashboardChunkFallback({ label }: { label: string }) {
  return (
    <div
      className="min-h-[60vh] flex-1 flex flex-col items-center justify-center gap-4 bg-paper"
      role="status"
      aria-live="polite"
    >
      <UsilMark className="w-12 h-12 opacity-90" />
      <div className="flex items-center gap-2.5">
        <span
          className="w-4 h-4 rounded-full border-2 border-line border-t-action animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-ink-2">{label}</p>
      </div>
    </div>
  );
}
