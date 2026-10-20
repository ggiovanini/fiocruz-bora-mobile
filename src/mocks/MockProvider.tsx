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
import {
  initialState,
  reducer,
  restoreState,
  type Action,
  type Activity,
  type MockState,
} from "./model";

const STORAGE_KEY = "bora:prototype:v1";
type MockContextValue = {
  state: MockState;
  ready: boolean;
  storageError: boolean;
  dispatch: (action: Action) => void;
  send: (activity: Activity) => Promise<void>;
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
  const dispatch = useCallback((action: Action) => {
    if (action.type === "reset") generation.current += 1;
    const next = reducer(current.current, action);
    current.current = next;
    setState(next);
    // Serialize writes so an older snapshot cannot overwrite a newer one.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, []);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (mounted) {
          const next = restoreState(raw);
          current.current = next;
          setState(next);
        }
      })
      .catch(() => {
        if (mounted) setStorageError(true);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const send = useCallback(
    async (activity: Activity) => {
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
    <Context.Provider value={{ state, ready, storageError, dispatch, send }}>
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
