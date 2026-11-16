import type { CatalogItem } from '@/api/contracts';
export type EnergyKind = 'physical' | 'intellectual';
/** The catalog defines one energy dimension per activity. */
export function supportsEnergy(item: Pick<CatalogItem, 'energy_dimension' | 'discovery_group'>, kind: EnergyKind) {
  return item.energy_dimension === kind;
}
export function recentDates(today: string, windowDays: number) {
  return Array.from({ length: Math.max(1, Math.min(7, windowDays)) }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
}
