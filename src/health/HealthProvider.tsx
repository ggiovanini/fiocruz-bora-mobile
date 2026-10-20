import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import adapter from "./adapter";
import { HealthSession } from "./model";
import { startAutomaticUpdates } from "./automatic";
const Context = createContext<{
  session: HealthSession;
  ready: boolean;
  preferenceError: boolean;
} | null>(null);
// Serialize preference writes across provider remounts. No health records are stored.
let preferenceWrites = Promise.resolve();
export function HealthProvider({
  children,
  enabled,
  preferenceKey,
}: PropsWithChildren<{ enabled: boolean; preferenceKey: string }>) {
  const [session] = useState(() => new HealthSession(adapter));
  const [ready, setReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let unsubscribe = () => {};
    void (async () => {
      try {
        await preferenceWrites;
        const raw = await AsyncStorage.getItem(preferenceKey);
        if (disposed) return;
        if (raw) {
          const saved = JSON.parse(raw);
          if (
            typeof saved.connected === "boolean" &&
            typeof saved.automatic === "boolean"
          )
            session.restorePreferences(saved);
        }
      } catch {
        if (!disposed) setPreferenceError(true);
      }
      if (disposed) return;
      let previous = JSON.stringify({
        connected: session.getSnapshot().connected,
        automatic: session.getSnapshot().automatic,
      });
      unsubscribe = session.subscribe(() => {
        const { connected, automatic } = session.getSnapshot();
        const next = JSON.stringify({ connected, automatic });
        if (next === previous) return;
        previous = next;
        preferenceWrites = preferenceWrites
          .then(() => AsyncStorage.setItem(preferenceKey, next))
          .then(() => {
            if (!disposed) setPreferenceError(false);
          })
          .catch(() => {
            if (!disposed) setPreferenceError(true);
          });
      });
      setReady(true);
    })();
    return () => {
      disposed = true;
      unsubscribe();
      session.disconnect();
    };
  }, [session, enabled, preferenceKey]);
  useEffect(() => {
    if (!enabled || !ready) return;
    const updates = startAutomaticUpdates(
      session,
      AppState.currentState === "active",
    );
    const sub = AppState.addEventListener("change", (state) =>
      updates.setActive(state === "active"),
    );
    return () => {
      updates.stop();
      sub.remove();
    };
  }, [session, enabled, ready]);
  return (
    <Context.Provider value={{ session, ready, preferenceError }}>
      {children}
    </Context.Provider>
  );
}
export function useHealth() {
  const context = useContext(Context);
  if (!context) throw new Error("HealthProvider is required");
  const { session, ready, preferenceError } = context;
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return { session, state, adapter, ready, preferenceError };
}
