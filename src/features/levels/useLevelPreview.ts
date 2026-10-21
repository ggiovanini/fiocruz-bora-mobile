import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { useEnergyPreview } from '../avatar/EnergyPreview';
import { levelProgress } from './progression';

// Independent fictional opening balances. Never derive lifetime EV from vitality.
export const OPENING_VITALITY_POINTS = 885;
export const OPENING_TOTAL_EARNED_EV = 885;
export function useLevelPreview() {
  const { api } = useMock();
  const { energy } = useEnergyPreview();
  const todayEV = energy.green + energy.blue;
  if (apiEnabled) {
    const summary = api.data.energy;
    const level = summary?.vitality.level;
    return {
      vitality: summary?.vitality.points ?? 0, level: level?.number ?? 0,
      floor: level?.minimum_pv ?? 0, next: level?.next?.minimum_pv ?? level?.minimum_pv ?? 0,
      remaining: level?.remaining_pv ?? 0, progress: level?.progress_percent ?? 0,
      totalEarnedEV: summary?.lifetime_earned_ev ?? 0, todayEV: summary?.today.total_ev ?? 0,
      openingVitality: 0, inactiveDays: summary?.inactivity.completed_days ?? 0,
    };
  }
  return {
    ...levelProgress(OPENING_VITALITY_POINTS + todayEV),
    totalEarnedEV: OPENING_TOTAL_EARNED_EV + todayEV,
    todayEV, openingVitality: OPENING_VITALITY_POINTS, inactiveDays: 0,
  };
}
