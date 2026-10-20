export type ActivityStatus = "pending" | "sending" | "confirmed" | "failed";
export type Draft = {
  id: string;
  type: string;
  minutes: string;
  date: string;
  missionId?: string;
  activityName?: string;
};
export type Activity = Draft & { status: ActivityStatus; createdAt: string };
export type MockState = {
  version: 1;
  session: "signedOut" | "active" | "expired";
  accepted: boolean;
  profileComplete: boolean;
  telemetry: boolean;
  name: string;
  organization: string;
  offline: boolean;
  failNext: boolean;
  draft: Draft | null;
  activities: Activity[];
  checkins: string[];
  resumePath: string | null;
};
export const initialState: MockState = {
  version: 1,
  session: "signedOut",
  accepted: false,
  profileComplete: false,
  telemetry: false,
  name: "Participante",
  organization: "Fiocruz · Cogetic",
  offline: false,
  failNext: false,
  draft: null,
  activities: [],
  checkins: [],
  resumePath: null,
};
export type Action =
  | {
      type: "patch";
      value: Partial<
        Pick<
          MockState,
          | "session"
          | "accepted"
          | "profileComplete"
          | "telemetry"
          | "name"
          | "organization"
          | "offline"
          | "failNext"
          | "resumePath"
        >
      >;
    }
  | { type: "draft"; value: Draft | null }
  | { type: "enqueue"; value: Activity }
  | { type: "status"; id: string; value: ActivityStatus }
  | { type: "checkin"; id: string }
  | { type: "reset" };
export function reducer(state: MockState, action: Action): MockState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.value };
    case "draft":
      return { ...state, draft: action.value };
    case "enqueue":
      return state.activities.some((a) => a.id === action.value.id)
        ? state
        : {
            ...state,
            activities: [action.value, ...state.activities],
            draft: null,
          };
    case "status":
      return {
        ...state,
        activities: state.activities.map((a) =>
          a.id === action.id && a.status !== "confirmed"
            ? { ...a, status: action.value }
            : a,
        ),
      };
    case "checkin":
      return state.checkins.includes(action.id)
        ? state
        : { ...state, checkins: [...state.checkins, action.id] };
    case "reset":
      return { ...initialState };
  }
}
// Illustrative discovery catalogue, not a server-approved EV classification.
export const activityOptions = [
  { type: "Caminhada", group: "movement", icon: "activity" },
  { type: "Corrida", group: "movement", icon: "activity" },
  { type: "Ciclismo", group: "movement", icon: "activity" },
  { type: "Natação", group: "movement", icon: "activity" },
  { type: "Treino", group: "movement", icon: "activity" },
  { type: "Leitura", group: "mind", icon: "book" },
  { type: "Estudo", group: "mind", icon: "book" },
  { type: "Podcast", group: "mind", icon: "book" },
  { type: "Meditação", group: "wellbeing", icon: "leaf" },
  { type: "Yoga", group: "wellbeing", icon: "leaf" },
  { type: "Pausa de bem-estar", group: "wellbeing", icon: "leaf" },
  { type: "Outra atividade", group: "other", icon: "plus" },
] as const;
export function activityTitle(draft: Draft) {
  return draft.type === "Outra atividade" ? draft.activityName?.trim() || draft.type : draft.type;
}
export function validateDraft(draft: Draft): string | null {
  if (!activityOptions.some(option => option.type === draft.type))
    return "Selecione uma atividade da lista.";
  if (draft.type === "Outra atividade" && (typeof draft.activityName !== "string" || draft.activityName.trim().length < 2 || draft.activityName.trim().length > 80))
    return "Dê um nome à atividade, entre 2 e 80 caracteres.";
  if (
    !/^\d+$/.test(draft.minutes) ||
    Number(draft.minutes) < 1 ||
    Number(draft.minutes) > 1440
  )
    return "Informe uma duração entre 1 e 1440 minutos.";
  const date = new Date(`${draft.date}T12:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
    Number.isNaN(date.valueOf()) ||
    date.getFullYear() !== Number(draft.date.slice(0, 4)) ||
    date.getMonth() + 1 !== Number(draft.date.slice(5, 7)) ||
    date.getDate() !== Number(draft.date.slice(8, 10)) ||
    date > today
  )
    return "Informe uma data válida, até hoje, no formato AAAA-MM-DD.";
  return null;
}
export function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function newDraft(missionId?: string): Draft {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "Caminhada",
    minutes: "",
    date: localDate(),
    missionId,
  };
}
export function restoreState(raw: string | null): MockState {
  if (!raw) return { ...initialState };
  try {
    const s = JSON.parse(raw) as MockState & { avatar?: unknown };
    if (
      s.version !== 1 ||
      !Array.isArray(s.activities) ||
      !Array.isArray(s.checkins) ||
      !["signedOut", "active", "expired"].includes(s.session)
    )
      return { ...initialState };
    // Older prototypes stored a selectable emoji avatar. Ignore that legacy
    // preference while preserving the participant and their local records.
    delete s.avatar;
    return {
      ...initialState,
      ...s,
      failNext: false,
      activities: s.activities.map((a) => ({
        ...a,
        status: a.status === "sending" ? "pending" : a.status,
      })),
    };
  } catch {
    return { ...initialState };
  }
}

// Progress is a fixture for navigation review, not the future scoring rule.
export function mockMissionProgress(
  activities: Activity[],
  missionId: string,
  goal: number,
) {
  const minutes = activities
    .filter((a) => a.missionId === missionId && a.status === "confirmed")
    .reduce((sum, a) => sum + Number(a.minutes), 0);
  return { minutes, done: minutes >= goal };
}
