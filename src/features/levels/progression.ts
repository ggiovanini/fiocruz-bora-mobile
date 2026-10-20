/** Example parameters for the UI only, not an approved production economy. */
export const PREVIEW_LEVEL_RULE = { graceDays: 7, dailyDecay: 20, thresholdStep: 100 } as const;

function nonNegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) throw new Error(`${name} deve ser um número não negativo e seguro.`);
}
export function levelThreshold(level: number) {
  if (!Number.isSafeInteger(level) || level < 1) throw new Error('Nível deve ser um inteiro positivo.');
  // Increasing gaps: levels 1–5 are easier; higher levels require more vitality.
  return PREVIEW_LEVEL_RULE.thresholdStep * level * (level - 1) / 2;
}
export function levelProgress(vitality: number) {
  nonNegative(vitality, 'Vitalidade');
  let level = Math.floor((1 + Math.sqrt(1 + 8 * vitality / PREVIEW_LEVEL_RULE.thresholdStep)) / 2);
  while (level > 1 && levelThreshold(level) > vitality) level--;
  while (levelThreshold(level + 1) <= vitality) level++;
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return {
    vitality, level, floor, next, remaining: next - vitality,
    progress: (vitality - floor) / (next - floor) * 100,
  };
}

export type EvolutionBalances = { vitality: number; totalEarnedEV: number };

/** Seven completed inactive days have no decay; the first charge is on day eight. */
export function projectInactivity({ vitality, totalEarnedEV, inactiveDays = 0, days, protectedRest = false }: {
  inactiveDays?: number; days: number; protectedRest?: boolean;
} & EvolutionBalances) {
  nonNegative(vitality, 'Vitalidade');
  nonNegative(totalEarnedEV, 'EV acumulados');
  for (const value of [inactiveDays, days]) if (!Number.isSafeInteger(value) || value < 0) throw new Error('Dias devem ser inteiros não negativos.');
  if (!Number.isSafeInteger(inactiveDays + days)) throw new Error('Período fora da faixa suportada.');
  const { graceDays, dailyDecay } = PREVIEW_LEVEL_RULE;
  const alreadyChargeable = Math.max(0, inactiveDays - graceDays);
  const chargeableDays = protectedRest ? 0 : Math.max(0, inactiveDays + days - graceDays) - alreadyChargeable;
  const loss = Math.min(vitality, chargeableDays * dailyDecay);
  return { ...levelProgress(vitality - loss), totalEarnedEV, chargeableDays, loss, inactiveDays: protectedRest ? inactiveDays : inactiveDays + days };
}

/** Any eligible contribution replenishes the vitality and ends the inactive streak. */
export function replenish({ vitality, totalEarnedEV, inactiveDays = 0 }: EvolutionBalances & { inactiveDays?: number }, green: number, blue: number) {
  for (const value of [vitality, totalEarnedEV, green, blue]) nonNegative(value, 'Energia');
  if (!Number.isSafeInteger(inactiveDays) || inactiveDays < 0) throw new Error('Dias devem ser inteiros não negativos.');
  const nextTotal = totalEarnedEV + green + blue;
  nonNegative(nextTotal, 'EV acumulados');
  return { ...levelProgress(vitality + green + blue), totalEarnedEV: nextTotal, inactiveDays: green + blue > 0 ? 0 : inactiveDays };
}
