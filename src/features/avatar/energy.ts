/** Daily EV is additive; neither energy source has a required quota. */
export function dailyEnergy(green: number, blue: number, goal: number) {
  if (![green, blue, goal].every(Number.isFinite) || green < 0 || blue < 0 || goal <= 0) {
    throw new Error('Energia deve ser não negativa e a meta deve ser positiva.');
  }
  const total = green + blue;
  // Keep the actual total above the goal, but bound the arc to one full track.
  const denominator = Math.max(goal, total);
  return {
    total,
    remaining: Math.max(0, goal - total),
    progress: Math.min(100, total / goal * 100),
    greenProgress: green / denominator * 100,
    blueProgress: blue / denominator * 100,
    complete: total >= goal,
  };
}
