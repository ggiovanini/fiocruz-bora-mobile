import { shiftDay, type EnergyDay } from './calendar';

/** Illustrative history only. Activity records never award points through this fixture. */
export function previewHistory(today: string): EnergyDay[] {
  const values = [
    [0, 120], [100, 0], [60, 50], [25, 30], [80, 30], [0, 0], [45, 60],
    [0, 100], [35, 10], [65, 40], [100, 15], [0, 0], [40, 60], [20, 25],
  ];
  return values.map(([green, blue], index) => ({ date: shiftDay(today, -(index + 1)), green, blue, goal: 100 }));
}
