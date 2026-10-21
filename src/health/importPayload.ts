import type { HealthWorkout } from './model';
export function importPayload(workout: HealthWorkout, activityType: string, dimension?: 'physical' | 'intellectual') {
  if (!activityType || !workout.externalId) throw new Error('Selecione a atividade do treino.');
  const seconds = Math.floor(workout.durationMinutes * 60);
  const start = new Date(workout.start), end = new Date(workout.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || seconds < 60 || seconds > 86400 || seconds > (end.getTime()-start.getTime())/1000+1) throw new Error('O treino precisa ter duração válida entre 1 minuto e 24 horas.');
  return { source: workout.source === 'healthkit' ? 'apple_health' : 'health_connect', external_id: workout.externalId,
    activity_type: activityType, starts_at: start.toISOString(), ends_at: end.toISOString(), duration_seconds: seconds,
    ...(dimension ? {energy_dimension:dimension} : {}), confirmed: true };
}
