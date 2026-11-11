import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { apiEnabled, apiRequest } from '@/api/session';
import { hasAccess, useMock } from '@/mocks/MockProvider';
import { usePermissionSetupComplete } from '../permissions/PermissionSetup';
import { usePresentationReady } from './usePresentationReady';
import { CelebrationScreen } from './CelebrationScreen';
import { closingWord, unseen, type Celebration } from './model';

// These are completed/read-only destinations. Camera, forms and native permission flows stay uninterrupted.
const destinations = new Set(['/home', '/missions', '/ranking', '/discover', '/events', '/medals', '/levels', '/history', '/constancy', '/mission']);
export function CelebrationPresenter() {
  const { state, api, ready } = useMock();
  const path = usePathname();
  const setupComplete = usePermissionSetupComplete();
  const active = setupComplete && apiEnabled && ready && hasAccess(state) && !!state.userId && !state.offline;
  return active ? <UserCelebrations key={state.userId} userId={state.userId!} path={path} allowed={destinations.has(path)} revision={api.data.energy} busy={api.busy}/> : null;
}
function UserCelebrations({ userId, path, allowed, revision, busy }: { userId: string; path: string; allowed: boolean; revision: unknown; busy: boolean }) {
  const [items, setItems] = useState<Celebration[]>([]);
  const [closing, setClosing] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [word, setWord] = useState('Incrível!');
  const lastWord = useRef<string | undefined>(undefined);
  const displayed = useRef<string | null>(null);
  const closed = useRef<string[]>([]);
  const loaded = useRef(false);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const lock = useRef(false);
  const storageKey = `bora:celebration-receipts:v1:${userId}`;
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    alive.current = true;
    const sync = async () => {
      if (inFlight.current || lock.current || !alive.current || (AppState.currentState === 'background' || AppState.currentState === 'inactive')) return;
      inFlight.current = true;
      try {
        if (!loaded.current) {
          const raw = await AsyncStorage.getItem(storageKey);
          const value = raw ? JSON.parse(raw) : [];
          closed.current = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
          loaded.current = true;
        }
        if (!alive.current) return;
        let result = await apiRequest('/me/celebrations');
        let acknowledged = false;
        for (const entry of result.data as Celebration[]) {
          if (!alive.current) return;
          if (closed.current.includes(entry.id)) {
            await apiRequest(`/me/celebrations/${entry.id}/dismiss`, { method: 'PATCH' });
            acknowledged = true;
          }
        }
        if (acknowledged && alive.current) result = await apiRequest('/me/celebrations');
        if (alive.current) setItems(unseen(result.data, closed.current));
      } catch { /* Pending items and durable receipts are retried on the next refresh. */ }
      finally { inFlight.current = false; }
    };
    refreshRef.current = sync;
    void sync();
    const listener = AppState.addEventListener('change', next => { setForeground(next === 'active'); if (next === 'active') void sync(); });
    const timer = setInterval(() => { void sync(); }, 30000);
    return () => { alive.current = false; clearInterval(timer); listener.remove(); };
  }, [storageKey]);
  useEffect(() => { if (allowed && !busy) void refreshRef.current(); }, [revision, allowed, busy]);
  const presentationReady = usePresentationReady(path, allowed && foreground);
  const item = items[0];
  useEffect(() => {
    if (!item || displayed.current === item.id) return;
    displayed.current = item.id;
    const next = closingWord(lastWord.current);
    lastWord.current = next;
    setWord(next);
  }, [item?.id]);
  const close = async () => {
    if (!item || lock.current) return;
    lock.current = true; setClosing(true);
    try {
      // Persist before advancing so lost responses cannot bring this screen back.
      const receipts = [...new Set([...closed.current, item.id])];
      await AsyncStorage.setItem(storageKey, JSON.stringify(receipts));
      closed.current = receipts;
      if (alive.current) setItems(current => current.filter(value => value.id !== item.id));
    } catch { /* Keep the item visible if durable storage is unavailable. */ }
    finally {
      lock.current = false;
      if (alive.current) { setClosing(false); if (items.length === 1) void refreshRef.current(); }
    }
  };
  return item && presentationReady ? <CelebrationScreen item={item} word={word} busy={closing} onClose={() => { void close(); }}/> : null;
}
