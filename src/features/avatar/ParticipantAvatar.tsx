import { EnergyAvatar } from './EnergyAvatar';
import { useEnergyPreview } from './EnergyPreview';
import { dailyEnergy } from './energy';
/** All participants use the same 3D character; only journey state varies. */
export function ParticipantAvatar({ introductory = false, height = 240 }: { introductory?: boolean; height?: number }) {
  const { energy, goal } = useEnergyPreview();
  const daily = dailyEnergy(energy.green, energy.blue, goal);
  return <EnergyAvatar greenProgress={introductory ? 0 : daily.greenProgress} blueProgress={introductory ? 0 : daily.blueProgress} height={height}/>;
}
