export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  qr_instructions: string;
  image_url?: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  checked_in: boolean;
  medal?: { name: string; style: string; image_url?: string | null };
};
const zone = 'America/Sao_Paulo';
export function eventDate(value: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR', { timeZone: zone, dateStyle: 'short', timeStyle: 'short' }) : 'A definir';
}
export function eventPeriod(event: Event) {
  if (!event.starts_at || !event.ends_at) return 'Data e horário a definir';
  return `${eventDate(event.starts_at)} – ${eventDate(event.ends_at)}`;
}
export function eventStatus(event: Event, now = Date.now()) {
  if (event.checked_in) return 'Presença confirmada';
  if (event.active) return 'Em andamento';
  return event.ends_at && Date.parse(event.ends_at) < now ? 'Encerrado' : 'Em breve';
}
