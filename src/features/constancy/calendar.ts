import { dailyEnergy } from '../avatar/energy';

/** API-ready daily snapshot: each date retains the goal in effect that day. */
export type EnergyDay = { date: string; green: number; blue: number; goal: number };
export type DayStatus = 'complete' | 'partial' | 'empty' | 'future';
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function localDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  // Noon avoids UTC date shifts and midnight daylight-saving transitions.
  return new Date(year, month - 1, day, 12);
}
export function shiftDay(key: string, days: number) {
  const date = localDate(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
export function monthCells(month: string): (string | null)[] {
  const first = localDate(`${month}-01`);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function shiftMonth(month: string, count: number) {
  const date = localDate(`${month}-01`);
  date.setMonth(date.getMonth() + count);
  return dateKey(date).slice(0, 7);
}
export function dayStatus(date: string, today: string, record?: EnergyDay): DayStatus {
  if (date > today) return 'future';
  if (!record) return 'empty';
  const energy = dailyEnergy(record.green, record.blue, record.goal);
  return energy.complete ? 'complete' : energy.total > 0 ? 'partial' : 'empty';
}
/** An unfinished today keeps yesterday's streak; an unfinished past day breaks it. */
export function currentStreak(today: string, records: EnergyDay[]) {
  const days = new Map(records.map(day => [day.date, day]));
  let cursor = dayStatus(today, today, days.get(today)) === 'complete' ? today : shiftDay(today, -1);
  let count = 0;
  while (dayStatus(cursor, today, days.get(cursor)) === 'complete') {
    count++;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}
export function completedInMonth(month: string, today: string, records: EnergyDay[]) {
  return records.filter(day => day.date.startsWith(`${month}-`) && dayStatus(day.date, today, day) === 'complete').length;
}
