'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';

interface RelativeTimeProps {
  isoDate: string;
  className?: string;
}

/**
 * Displays relative time (e.g. "2h", "5m") from the given ISO date.
 * Uses the client's current time and updates periodically so the value stays accurate.
 */
export function RelativeTime({ isoDate, className }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(isoDate));

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(isoDate));
    update(); // recalc with client's "now" on mount
    const intervalMs = 60 * 1000; // update every minute
    const id = setInterval(update, intervalMs);
    return () => clearInterval(id);
  }, [isoDate]);

  return <span className={className}>{label}</span>;
}
