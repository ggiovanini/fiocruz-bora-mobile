export type Challenge = {
  id: string; title: string; description: string;
  metric: 'minutes' | 'activities' | 'ev'; target: number; progress: number; progress_percent: number;
  starts_on: string; ends_on: string; activity_type: string | null; activity_name: string | null;
  period_status: 'active' | 'upcoming' | 'ended'; completed: boolean;
  medal: { name: string; description: string; style: string; image_url?: string | null; earned: boolean } | null;
};
const units = { minutes: 'min', activities: 'atividades', ev: 'EV' };
export const challengeDate = (value: string) => value.split('-').reverse().join('/');
export function challengeProgress(challenge: Challenge) {
  return `${challenge.progress.toLocaleString('pt-BR')} / ${challenge.target.toLocaleString('pt-BR')} ${challenge.metric === 'activities' && challenge.target === 1 ? 'atividade' : units[challenge.metric]}`;
}
export function challengePercent(challenge: Challenge) {
  return Number.isFinite(challenge.progress_percent) ? Math.max(0, Math.min(100, challenge.progress_percent)) : 0;
}
export function challengeStatus(challenge: Challenge) {
  if (challenge.completed) return 'Concluído';
  if (challenge.period_status === 'upcoming') return 'Em breve';
  return challenge.period_status === 'ended' ? 'Encerrado' : 'Em andamento';
}
export function challengeDeadline(challenge: Challenge) {
  if (challenge.period_status === 'upcoming') return `Começa ${challengeDate(challenge.starts_on)} · até ${challengeDate(challenge.ends_on)}`;
  return `${challenge.period_status === 'ended' ? 'Encerrado em' : 'Até'} ${challengeDate(challenge.ends_on)}`;
}
export function canRegisterChallenge(challenge: Challenge) {
  return challenge.period_status === 'active' && !challenge.completed;
}
