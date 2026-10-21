import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import {
  initialState,
  reducer,
  restoreState,
  type Action,
  type Activity,
  type MockState,
} from "./model";

import { apiEnabled, restoreApiSession, onSessionExpired } from "@/api/session";

import { journeyStorageKey, useJourneyConnection } from "@/api/useJourneyConnection";

const STORAGE_KEY = "bora:prototype:v1";
type MockContextValue = {
  state: MockState;
  ready: boolean;
  storageError: boolean;
  dispatch: (action: Action) => void;
  send: (activity: Activity) => Promise<void>;
  api: ReturnType<typeof useJourneyConnection>;
};
const Context = createContext<MockContextValue | null>(null);
export function MockProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef(Promise.resolve());
  const inFlight = useRef(new Set<string>());
  const generation = useRef(0);
  const commit = useCallback((next: MockState) => {
    current.current = next;
    setState(next);
    const key = apiEnabled ? next.userId ? journeyStorageKey(next.userId, next.membershipId) : null : STORAGE_KEY;
    if (!key) return;
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(key, JSON.stringify(next)))
      .then(() => setStorageError(false)).catch(error => { setStorageError(true); throw error; });
    void writes.current.catch(() => {});
  }, []);
  const api = useJourneyConnection(current, commit, writes);
  const apiRef = useRef(api);
  apiRef.current = api;
  const dispatch = useCallback((action: Action) => {
    if (apiEnabled && ((action.type === "patch" && action.value.session === "signedOut") || action.type === "reset")) {
      void apiRef.current.logout();
      return;
    }
    if (action.type === "reset") generation.current += 1;
    commit(reducer(current.current, action));
  }, [commit]);
  useEffect(() => onSessionExpired(() => apiRef.current.expire()), []);
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      if (apiEnabled) {
        const user = await restoreApiSession();
        if (user && mounted) await apiRef.current.connect(user.id);
      } else {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted) { const next = restoreState(raw); current.current = next; setState(next); }
      }
    };
    void restore().catch(() => {
      // No API identity or data is replaced with prototype fixtures on failure.
    }).finally(() => { if (mounted) setReady(true); });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!apiEnabled) return;
    let lastRefresh = Date.now();
    const refresh = () => {
      if (current.current.session !== 'active' || apiRef.current.busy || Date.now() - lastRefresh < 30000) return;
      lastRefresh = Date.now();
      void apiRef.current.refresh().catch(() => {});
    };
    const listener = AppState.addEventListener('change', next => { if (next === 'active') refresh(); });
    const timer = setInterval(() => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (AppState.currentState === 'active' && apiRef.current.data.energy && apiRef.current.data.energy.today.date !== today) refresh();
    }, 60000);
    return () => { listener.remove(); clearInterval(timer); };
  }, []);
  const send = useCallback(
    async (activity: Activity) => {
      if (apiEnabled) { await apiRef.current.send(activity); return; }
      const s = current.current;
      if (
        s.offline ||
        s.session !== "active" ||
        !s.accepted ||
        inFlight.current.has(activity.id) ||
        s.activities.find((a) => a.id === activity.id)?.status === "confirmed"
      )
        return;
      inFlight.current.add(activity.id);
      const token = generation.current;
      const fail = s.failNext;
      dispatch({ type: "patch", value: { failNext: false } });
      dispatch({ type: "status", id: activity.id, value: "sending" });
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (generation.current === token) {
        const now = current.current;
        dispatch({
          type: "status",
          id: activity.id,
          value:
            now.offline || now.session !== "active" || !now.accepted
              ? "pending"
              : fail
                ? "failed"
                : "confirmed",
        });
      }
      inFlight.current.delete(activity.id);
    },
    [dispatch],
  );
  useEffect(() => {
    if (
      ready &&
      !state.offline &&
      state.session === "active" &&
      state.accepted
    ) {
      state.activities
        .filter((a) => a.status === "pending")
        .forEach((a) => {
          void send(a);
        });
    }
  }, [
    ready,
    state.offline,
    state.session,
    state.accepted,
    state.activities,
    send,
  ]);
  return (
    <Context.Provider value={{ state, ready, storageError, dispatch, send, api }}>
      {children}
    </Context.Provider>
  );
}
export function useMock() {
  const context = useContext(Context);
  if (!context) throw new Error("MockProvider is required");
  return context;
}
export function hasAccess(state: MockState) {
  return state.session === "active" && state.accepted && state.profileComplete;
}
