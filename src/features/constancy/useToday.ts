import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dateKey } from './calendar';

export function useToday() {
  const [today, setToday] = useState(() => dateKey(new Date()));
  useEffect(() => {
    const update = () => setToday(dateKey(new Date()));
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(update, midnight.getTime() - now.getTime() + 100);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [today]);
  return today;
}
