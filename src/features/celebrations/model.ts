export type Celebration = {
  id: string;
  type: 'daily_goal_reached' | 'achievement_awarded' | 'event_checked_in' | 'level_up' | 'challenge_completed';
  occurred_at: string;
  payload: { title: string; name: string; description?: string | null; style?: string; image_url?: string | null; date?: string; level?: number };
};
const words = ['Incrível!', 'Demais!', 'Mandei bem!', 'Arrasei!', 'Boa!'];
export function closingWord(previous?: string, random = Math.random): string {
  const choices = words.filter(word => word !== previous);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
}
export function unseen(items: Celebration[], closed: string[]) {
  const seen = new Set(closed);
  return items.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
}
export function celebrationDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
