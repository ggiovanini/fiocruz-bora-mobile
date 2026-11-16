import type { CatalogItem } from '../api/contracts';
import type { HealthWorkout } from './model';

export const normalizeActivityName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const nativeKinds: Record<string, string> = { Caminhada: 'walking', Corrida: 'running', 'Corrida em esteira': 'running', Ciclismo: 'cycling', 'Natação': 'swimming', Yoga: 'yoga', Treino: 'workout', 'Musculação': 'workout', 'Treino funcional': 'workout', 'Treino intervalado': 'workout' };
const aliases: Record<string, string[]> = {
  walking: ['caminhada', 'caminhar', 'walking', 'walk'], running: ['corrida', 'correr', 'running', 'run'],
  swimming: ['natacao', 'nadar', 'swimming', 'swim'], cycling: ['ciclismo', 'bicicleta', 'pedalada', 'bike', 'cycling'],
  workout: ['treino', 'treinamento', 'musculacao', 'workout', 'strength training'], yoga: ['yoga', 'ioga'],
};

/** Exact words/phrases, specific categories before generic training; ambiguous titles use the native modality. */
export function resolveWorkoutActivity(workout: HealthWorkout, catalog: CatalogItem[]): CatalogItem | undefined {
  const physical = catalog.filter(item => item.scoring_status === 'configured' && item.energy_dimension === 'physical');
  const title = ` ${normalizeActivityName(workout.name || '')} `;
  const hits = physical.filter(item => !item.requires_custom_name).map(item => ({ item, score: Math.max(0,
    ...[item.name || '', ...(aliases[item.code] || [])].map(name => normalizeActivityName(name)).filter(Boolean)
      .filter(name => title.includes(` ${name} `)).map(name => name.split(' ').length)) })).filter(hit => hit.score > 0);
  const specific = hits.filter(hit => hit.item.code !== 'workout');
  const candidates = specific.length ? specific : hits;
  const bestScore = Math.max(0, ...candidates.map(hit => hit.score));
  const best = candidates.filter(hit => hit.score === bestScore);
  if (best.length === 1) return best[0].item;
  const native = physical.find(item => item.code === nativeKinds[workout.kind] && !item.requires_custom_name);
  if (native && (!best.length || best.some(hit => hit.item.code === native.code))) return native;
  return physical.find(item => item.code === 'other');
}

export const nativeWorkoutActivityCode = (workout: HealthWorkout) => nativeKinds[workout.kind] || 'other';
