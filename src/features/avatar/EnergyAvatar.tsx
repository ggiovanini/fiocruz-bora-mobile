import { Component, Suspense, useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Copy } from '@/ui/Flow';
import AvatarViewport from './AvatarViewport';
import type { Motion } from './AvatarScene';
class Boundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Copy>O avatar 3D está indisponível neste dispositivo. Seu progresso continua disponível abaixo.</Copy> : this.props.children; }
}
export function EnergyAvatar({ greenProgress, blueProgress, motion = 'idle', playing = true, speed = 1, height = 320, zoom = 1, respectReducedMotion = true }: { greenProgress: number; blueProgress: number; motion?: Motion; playing?: boolean; speed?: number; height?: number; zoom?: number; respectReducedMotion?: boolean }) {
  const [hasOpened, setHasOpened] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [reduced, setReduced] = useState(true);
  useFocusEffect(useCallback(() => { setHasOpened(true); setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); });
    const reduce = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const app = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { mounted = false; reduce.remove(); app.remove(); };
  }, []);
  // Keep the GL surface and resources alive across navigation. Only the render
  // loop is suspended while hidden/backgrounded; actual screen unmount still
  // lets Fiber dispose its resources normally.
  const rendering = focused && active;
  return <View pointerEvents={rendering ? 'auto' : 'none'} style={{ height, width: '100%' }} accessibilityLabel="Personagem Bóra e arco de energia verde e azul">
    {hasOpened && <Boundary><Suspense fallback={<Copy>Preparando seu avatar…</Copy>}><AvatarViewport zoom={zoom} motion={motion} rendering={rendering} playing={playing && (!respectReducedMotion || !reduced)} speed={speed} greenProgress={greenProgress} blueProgress={blueProgress} /></Suspense></Boundary>}
  </View>;
}
