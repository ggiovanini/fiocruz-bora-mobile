import { useEnergyPreview } from '../avatar/EnergyPreview';
import { levelProgress } from './progression';

// Independent fictional opening balances. Never derive lifetime EV from vitality.
export const OPENING_VITALITY_POINTS = 885;
export const OPENING_TOTAL_EARNED_EV = 885;
export function useLevelPreview() {
  const { energy } = useEnergyPreview();
  const todayEV = energy.green + energy.blue;
  return {
    ...levelProgress(OPENING_VITALITY_POINTS + todayEV),
    totalEarnedEV: OPENING_TOTAL_EARNED_EV + todayEV,
    todayEV, openingVitality: OPENING_VITALITY_POINTS, inactiveDays: 0,
  };
}
