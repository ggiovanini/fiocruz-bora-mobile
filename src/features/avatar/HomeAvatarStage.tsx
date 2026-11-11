import { Platform, useWindowDimensions } from 'react-native';
import { EnergyAvatar } from './EnergyAvatar';

/** Home uses only the live 3D scene; decorative PNGs are kept for later work. */
export function HomeAvatarStage({ physicalProgress, mentalProgress, complete }: { physicalProgress: number; mentalProgress: number; complete: boolean }) {
  const { width } = useWindowDimensions();
  // Keep the framing verified on the iOS simulator.
  const height = Platform.OS === 'ios' ? 420 : Math.round(Math.min(width, 520) * 1.2);
  return <EnergyAvatar greenProgress={physicalProgress} blueProgress={mentalProgress} height={height} zoom={1.08} motion={complete ? 'celebrate' : 'idle'}/>;
}
