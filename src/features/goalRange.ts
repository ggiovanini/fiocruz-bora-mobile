export const MIN_DAILY_GOAL = 15;
export const MAX_DAILY_GOAL = 240;
export function clampDailyGoal(value: number) {
  return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(Number.isFinite(value) ? value : MIN_DAILY_GOAL)));
}
export function goalAtPosition(position: number, width: number) {
  return clampDailyGoal(MIN_DAILY_GOAL + Math.max(0, Math.min(1, position / Math.max(1, width))) * (MAX_DAILY_GOAL - MIN_DAILY_GOAL));
}
