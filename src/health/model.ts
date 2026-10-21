export type HealthSource = "healthkit" | "health-connect";
export type Access = {
  steps: "granted" | "denied" | "unknown";
  workouts: "granted" | "denied" | "unknown";
};
export type Availability = "available" | "unsupported" | "update-required";
export type DayRange = { date: string; start: Date; end: Date };
export type HealthWorkout = {
  id: string;
  externalId: string;
  source: HealthSource;
  origin: string;
  kind: string;
  start: string;
  end: string;
  durationMinutes: number;
  status: "local-only";
};
export type HealthSteps = {
  date: string;
  count: number | null;
  source: HealthSource;
};
export type HealthSnapshot = {
  source: HealthSource;
  access: Access;
  workouts: HealthWorkout[];
  steps: HealthSteps[];
  syncedAt: string;
};
export interface HealthAdapter {
  label: string;
  availability(): Promise<Availability>;
  requestAccess(): Promise<Access>;
  read(days: DayRange[]): Promise<HealthSnapshot>;
  managePermissions(): Promise<void>;
}
export function lastSevenDays(now = new Date()): DayRange[] {
  const first = new Date(now);
  first.setHours(0, 0, 0, 0);
  first.setDate(first.getDate() - 6);
  return Array.from({ length: 7 }, (_, i) => {
    const start = new Date(first);
    start.setDate(first.getDate() + i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return {
      date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
      start,
      end: new Date(Math.min(end.getTime(), now.getTime())),
    };
  });
}
export function normalizeWorkout(
  source: HealthSource,
  record: {
    id: string;
    origin: string;
    kind: string;
    start: string;
    end: string;
    durationMinutes?: number;
  },
): HealthWorkout | null {
  const durationMinutes =
    record.durationMinutes ??
    (Date.parse(record.end) - Date.parse(record.start)) / 60000;
  if (
    !record.id ||
    !Number.isFinite(Date.parse(record.start)) ||
    !Number.isFinite(Date.parse(record.end)) ||
    Date.parse(record.end) < Date.parse(record.start) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 0
  )
    return null;
  return {
    id: `${source}:${record.id}`,
    externalId: record.id,
    source,
    origin: record.origin,
    kind: record.kind,
    start: record.start,
    end: record.end,
    durationMinutes,
    status: "local-only",
  };
}
export function uniqueWorkouts(records: HealthWorkout[]): HealthWorkout[] {
  return [
    ...new Map(records.map((record) => [record.id, record])).values(),
  ].sort((a, b) => b.start.localeCompare(a.start));
}
export type HealthState = {
  automatic: boolean;
  connected: boolean;
  busy: boolean;
  snapshot: HealthSnapshot | null;
  message: string;
  availability: Availability | null;
};
const empty = (): HealthState => ({
  automatic: true,
  connected: false,
  busy: false,
  snapshot: null,
  message: "",
  availability: null,
});
// Real device data is intentionally session-only until identity/API retention is defined.
// No AsyncStorage, telemetry, background reads, or mock scoring enters this controller.
export const AUTO_SYNC_INTERVAL = 5 * 60 * 1000;
export class HealthSession {
  private lastAttempt: number | null = null;
  private value = empty();
  private generation = 0;
  private listeners = new Set<() => void>();
  constructor(private adapter: HealthAdapter) {}
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(patch: Partial<HealthState>) {
    this.value = { ...this.value, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  restorePreferences = (preferences: {
    connected: boolean;
    automatic: boolean;
  }) => {
    this.publish({
      connected: preferences.connected,
      automatic: preferences.automatic,
    });
  };
  setAutomatic = (automatic: boolean) => {
    if (!automatic && this.value.busy) this.clearReadings();
    this.publish({ automatic });
  };
  nextAutomaticDelay(now = new Date()) {
    if (this.lastAttempt === null || now.getTime() < this.lastAttempt) return 0;
    return Math.max(0, AUTO_SYNC_INTERVAL - (now.getTime() - this.lastAttempt));
  }
  async syncIfDue(now = new Date()) {
    if (!this.value.automatic) return;
    const elapsed =
      this.lastAttempt === null ? Infinity : now.getTime() - this.lastAttempt;
    if (elapsed >= 0 && elapsed < AUTO_SYNC_INTERVAL) return;
    await this.sync(now);
  }
  disconnect = () => {
    this.lastAttempt = null;
    this.generation++;
    this.value = empty();
    this.listeners.forEach((fn) => fn());
  };
  clearReadings = () => {
    // Foregrounding may follow a permissions change. Invalidate in-flight reads,
    // but allow the authorization sheet to finish its own foreground transition.
    if (this.value.busy && !this.value.connected) return;
    this.generation++;
    this.publish({ snapshot: null, busy: false, message: "" });
  };
  async connect() {
    if (this.value.busy) return;
    const generation = ++this.generation;
    this.publish({ busy: true, message: "", snapshot: null, connected: false });
    try {
      const availability = await this.adapter.availability();
      if (generation !== this.generation) return;
      this.publish({ availability });
      if (availability !== "available") {
        this.publish({
          message:
            availability === "update-required"
              ? "Instale ou atualize o Health Connect neste aparelho."
              : "Integração indisponível neste ambiente. Use um build nativo em aparelho compatível.",
        });
        return;
      }
      const access = await this.adapter.requestAccess();
      if (generation !== this.generation) return;
      const connected =
        access.workouts !== "denied";
      this.publish({
        connected,
        message: connected
          ? "Solicitação concluída. Sincronize para consultar os dados que o sistema disponibilizar."
          : "Nenhuma permissão de leitura concedida. Você pode continuar com o registro manual.",
      });
    } catch {
      if (generation === this.generation)
        this.publish({
          message:
            "Não foi possível solicitar acesso. Confira as permissões e se o aplicativo foi recompilado com a integração nativa.",
        });
    } finally {
      if (generation === this.generation) this.publish({ busy: false });
    }
  }
  async sync(now = new Date()) {
    if (!this.value.connected || this.value.busy) return;
    this.lastAttempt = now.getTime();
    const generation = ++this.generation;
    this.publish({ busy: true, message: "", snapshot: null });
    try {
      const snapshot = await this.adapter.read(lastSevenDays(now));
      if (generation !== this.generation) return;
      if (
        snapshot.access.workouts === "denied"
      ) {
        this.publish({
          connected: false,
          message:
            "O acesso foi revogado. Autorize a leitura novamente para sincronizar.",
        });
        return;
      }
      // Replace the full query window: re-sync neither duplicates nor retains deleted/revoked records.
      this.publish({
        snapshot: { ...snapshot, workouts: uniqueWorkouts(snapshot.workouts) },
        message:
          "Leitura concluída. Selecione um treino e autorize seu envio para registrar na jornada.",
      });
    } catch {
      if (generation === this.generation)
        this.publish({
          message:
            "Não foi possível concluir a leitura. Confira o acesso no sistema e tente novamente.",
        });
    } finally {
      if (generation === this.generation) this.publish({ busy: false });
    }
  }
}
