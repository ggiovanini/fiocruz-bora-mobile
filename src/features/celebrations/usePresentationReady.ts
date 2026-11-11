import { useEffect, useState } from 'react';

// iOS cannot present a modal while native-stack is replacing its presenting controller.
// Restart this settling window on every route change; never mount the Modal mid-transition.
export function usePresentationReady(path: string, enabled: boolean) {
  const [settledPath, setSettledPath] = useState<string | null>(null);
  useEffect(() => {
    setSettledPath(null);
    if (!enabled) return;
    const timer = setTimeout(() => setSettledPath(path), 600);
    return () => clearTimeout(timer);
  }, [path, enabled]);
  return enabled && settledPath === path;
}
