import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeIntroduction, hasSeenIntroduction } from './firstLaunch';

export function useIntroduction() {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    let mounted = true;
    hasSeenIntroduction(AsyncStorage)
      .then(value => { if (mounted) setCompleted(value); })
      .catch(() => { /* A failed read must not skip a first-time introduction. */ })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  const finish = useCallback(async () => {
    await completeIntroduction(AsyncStorage);
    setCompleted(true);
  }, []);
  return { ready, completed, finish };
}
