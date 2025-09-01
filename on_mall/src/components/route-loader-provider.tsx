"use client";
import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Loader } from './loader';
import { useIsFetching } from '@tanstack/react-query';

/**
 * Displays a subtle top progress bar + centered loader overlay during:
 *  - Client-side route transitions
 *  - Pending React Query fetches
 *  - Slow navigations (>150ms) to avoid flashing for instant transitions
 */
const RouteLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFetching = useIsFetching();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const incrRef = useRef<NodeJS.Timeout | null>(null);

  // Start loader when either route changes or queries fetching
  useEffect(() => {
    // Small delay to prevent flicker on ultra-fast transitions
    if (!active && (isFetching > 0)) {
      timerRef.current = setTimeout(() => {
        setActive(true);
      }, 150);
    }
    if (isFetching === 0 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isFetching, active]);

  // Detect route param changes (pathname + search)
  const routeKey = pathname + '?' + searchParams?.toString();
  const prevRouteKey = useRef(routeKey);
  useEffect(() => {
    if (prevRouteKey.current !== routeKey) {
      prevRouteKey.current = routeKey;
      // Start transition loader immediately with delay guard
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setActive(true), 120);
    }
  }, [routeKey]);

  // Progress simulation while active
  useEffect(() => {
    if (active) {
      setProgress(10);
      const step = () => {
        setProgress((p) => {
          if (p >= 90) return p;
            const delta = Math.random() * 10;
            return Math.min(p + delta, 92);
        });
        incrRef.current = setTimeout(step, 400 + Math.random() * 400);
      };
      incrRef.current = setTimeout(step, 300);
    } else {
      setProgress(0);
      if (incrRef.current) clearTimeout(incrRef.current);
    }
    return () => { if (incrRef.current) clearTimeout(incrRef.current); };
  }, [active]);

  // Auto-complete when all network activity stops
  useEffect(() => {
    if (active && isFetching === 0) {
      setProgress(100);
      const t = setTimeout(() => setActive(false), 260); // allow bar to fill before hiding
      return () => clearTimeout(t);
    }
  }, [active, isFetching]);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 transition-all duration-200"
          style={{ width: `${progress}%`, opacity: active ? 1 : 0 }}
        />
      </div>
      {/* Dim overlay with loader (only for longer loads) */}
      {active && (
        <div className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center">
          <div className="scale-75 sm:scale-90 opacity-95">
            <Loader label="Loading" />
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default RouteLoaderProvider;
