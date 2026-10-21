import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiRequest } from './session';

/** Focus refresh and pagination share a request generation, so old screens cannot overwrite new data. */
export function usePagedResource<T extends { id: string }, M = Record<string, unknown>>(path: string) {
  const [metadata, setMetadata] = useState<M | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const next = useRef(1);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const load = useCallback(async (page: number, reset: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const token = ++sequence.current;
    setBusy(true); setError('');
    if (reset) { setItems([]); setMetadata(null); }
    try {
      const result = await apiRequest(`${path}?page=${page}`);
      if (token !== sequence.current) return;
      setItems(previous => [...new Map<string, T>((reset ? result.data : [...previous, ...result.data]).map((item: T) => [item.id, item])).values()]);
      const { data: _data, ...rest } = result;
      setMetadata(rest as M);
      next.current = result.current_page + 1;
      setMore(result.current_page < result.last_page);
    } catch (failure) {
      if (token === sequence.current) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar.');
    } finally { if (token === sequence.current) { inFlight.current = false; setBusy(false); } }
  }, [path]);
  useFocusEffect(useCallback(() => {
    void load(1, true);
    return () => { sequence.current++; inFlight.current = false; };
  }, [load]));
  return { items, metadata, busy, error, more, refresh: () => { void load(1, true); }, loadMore: () => { void load(next.current, false); } };
}
