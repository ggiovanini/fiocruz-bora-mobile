import type { Activity, Draft } from '../mocks/model';
import type { CatalogItem, ManualPayload, ServerActivity } from './contracts';

// These UUIDs identify operations, never credentials or authentication secrets.
export function uuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, value => {
    const random = Math.floor(Math.random() * 16);
    return (value === 'x' ? random : (random & 3) | 8).toString(16);
  });
}
export function validateApiDraft(draft: Draft, catalog: CatalogItem[], today: string): string | null {
  const item = catalog.find(item => item.code === draft.activityCode);
  if (!item) return 'Selecione uma atividade disponível.';
  if (!/^\d+$/.test(draft.minutes) || Number(draft.minutes) < 1 || Number(draft.minutes) > 1440) return 'Informe uma duração entre 1 e 1440 minutos.';
  if (item.requires_custom_name && (!draft.activityName || draft.activityName.trim().length < 2 || draft.activityName.trim().length > 80)) return 'Informe um nome entre 2 e 80 caracteres.';
  if (item.energy_dimension === 'choice' && !draft.energyDimension) return 'Escolha se a atividade foi física ou mental.';
  const date = new Date(`${draft.date}T12:00:00Z`);
  const lower = new Date(`${today}T12:00:00Z`);
  lower.setUTCDate(lower.getUTCDate() - item.recording_window_days + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== draft.date || draft.date > today || date < lower) return 'Escolha hoje ou um dos seis dias anteriores.';
  return null;
}
export function prepareActivity(draft: Draft, catalog: CatalogItem[], membership: string, today: string): Activity {
  const message = validateApiDraft(draft, catalog, today);
  if (message) throw new Error(message);
  const item = catalog.find(item => item.code === draft.activityCode)!;
  const id = uuid();
  const payload: ManualPayload = { client_activity_id: id, activity_type: item.code, activity_date: draft.date,
    timezone: item.timezone, duration_seconds: Number(draft.minutes) * 60,
    ...(item.requires_custom_name ? { custom_name: draft.activityName!.trim() } : {}),
    ...(item.energy_dimension === 'choice' ? { energy_dimension: draft.energyDimension } : {}),
  };
  return { ...draft, id, status: 'pending', createdAt: new Date().toISOString(),
    operationKey: uuid(), membershipId: membership, apiPayload: payload };
}
export function fromServer(row: ServerActivity): Activity {
  return { id: row.client_activity_id, serverId: row.id, type: row.activity_name, activityCode: row.activity_type,
    minutes: String(row.duration_seconds / 60), date: row.activity_date, createdAt: row.created_at,
    status: 'confirmed', error: undefined, validationStatus: row.validation_status, awardedEv: row.scoring.awarded_ev, membershipId: row.membership_id };
}
export function mergeActivities(local: Activity[], remote: ServerActivity[]): Activity[] {
  const rows = new Map(local.map(item => [item.id, item]));
  for (const row of remote) rows.set(row.client_activity_id, { ...rows.get(row.client_activity_id), ...fromServer(row) });
  return [...rows.values()].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
