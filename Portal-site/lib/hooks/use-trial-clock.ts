'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const monotonic = () => (typeof performance !== 'undefined' ? performance.now() : 0);

/**
 * Drives live "time remaining" text without reading the browser's wall clock.
 *  - `now` is a monotonic timestamp that re-renders every `intervalMs`;
 *  - when the tab becomes visible/focused again it ticks immediately and calls
 *    `onResume` (pages use it to re-read the server's expiry and server time);
 *  - `markRead()` records the monotonic instant at which fresh server data arrived,
 *    and `elapsed()` returns the time since then.
 */
export function useTrialClock(onResume?: () => void, intervalMs = 10_000) {
  const [now, setNow] = useState(monotonic);
  const readAt = useRef<number>(monotonic());
  const resume = useRef(onResume);
  resume.current = onResume;

  useEffect(() => {
    const tick = () => setNow(monotonic());
    const timer = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      tick();
      resume.current?.();
    };
    const onFocus = () => {
      tick();
      resume.current?.();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs]);

  const markRead = useCallback(() => {
    readAt.current = monotonic();
    setNow(readAt.current);
  }, []);

  const elapsed = useCallback(() => Math.max(0, now - readAt.current), [now]);

  return { now, markRead, elapsed };
}
