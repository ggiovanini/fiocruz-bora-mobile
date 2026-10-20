import type { HealthSession } from "./model";

/** One foreground timer shared by all screens. Automatic reads never prompt for access. */
export function startAutomaticUpdates(
  session: HealthSession,
  initiallyActive: boolean,
  clock = {
    now: () => new Date(),
    schedule: (callback: () => void, delay: number) =>
      setTimeout(callback, delay),
    cancel: (timer: ReturnType<typeof setTimeout> | undefined) =>
      clearTimeout(timer),
  },
) {
  let active = initiallyActive;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const update = () => {
    clock.cancel(timer);
    const state = session.getSnapshot();
    if (
      stopped ||
      !active ||
      !state.connected ||
      !state.automatic ||
      state.busy
    )
      return;
    void session.syncIfDue(clock.now());
    if (!session.getSnapshot().busy) {
      timer = clock.schedule(
        update,
        Math.max(1, session.nextAutomaticDelay(clock.now())),
      );
    }
  };
  const unsubscribe = session.subscribe(update);
  update();
  return {
    setActive(value: boolean) {
      if (stopped) return;
      active = value;
      if (!active) {
        clock.cancel(timer);
        session.clearReadings();
      } else update();
    },
    stop() {
      stopped = true;
      unsubscribe();
      clock.cancel(timer);
    },
  };
}
