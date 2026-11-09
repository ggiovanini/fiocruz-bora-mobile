import type { CatalogItem } from '@/api/contracts';
export type EnergyKind = 'physical' | 'intellectual';
/** Scoring dimension is authoritative; discovery groups are only a legacy fallback. */
export function supportsEnergy(item: Pick<CatalogItem, 'energy_dimension' | 'discovery_group'>, kind: EnergyKind) {
  if (item.energy_dimension === 'physical' || item.energy_dimension === 'intellectual') return item.energy_dimension === kind;
  if (item.energy_dimension === 'choice') return true;
  if (item.discovery_group === 'movement') return kind === 'physical';
  if (item.discovery_group === 'mind') return kind === 'intellectual';
  return true;
}
export function recentDates(today: string, windowDays: number) {
  return Array.from({ length: Math.max(1, Math.min(7, windowDays)) }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
}
