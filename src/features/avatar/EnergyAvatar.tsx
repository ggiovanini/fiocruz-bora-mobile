import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, AppState, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMock } from '@/mocks/MockProvider';
import { apiEnabled } from '@/api/session';
import { Copy } from '@/ui/Flow';
import AvatarViewport from './AvatarViewport';
import { BeanPreviewImage } from './BeanPreviewImage';
import { EnergyHalo } from './EnergyHalo';
import type { Group } from 'three';
import type { Motion } from './AvatarScene';
const BEAN_RETURN_DELAY_MS = 1800;
const BEAN_RADIANS_PER_POINT = Math.PI / 140;

class Boundary extends Component<PropsWithChildren<{ beanPreview: boolean }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.beanPreview ? <BeanPreviewImage /> : <Copy>O avatar 3D está indisponível neste dispositivo. Seu progresso continua disponível abaixo.</Copy> : this.props.children; }
}
export function EnergyAvatar({ greenProgress, blueProgress, motion = 'idle', motionRequest, onPress, playing = true, speed = 1, height = 320, zoom = 1, respectReducedMotion = true, showPlatform = true, beanPreview = false }: { greenProgress: number; blueProgress: number; motion?: Motion; motionRequest?: number; onPress?: () => void; playing?: boolean; speed?: number; height?: number; zoom?: number; respectReducedMotion?: boolean; showPlatform?: boolean; beanPreview?: boolean }) {
  const { api } = useMock();
  const appearance = apiEnabled ? api.data.energy?.character_energy?.appearance : undefined;
  const [hasOpened, setHasOpened] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === 'active');
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
  const pivot = useRef<Group>(null);
  const dragStart = useRef(0);
  const dragged = useRef(false);
  const [angle, setAngle] = useState<number | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelReturn = useCallback(() => {
    if (returnTimer.current !== null) clearTimeout(returnTimer.current);
    returnTimer.current = null;
  }, []);

  const scheduleReturn = useCallback(() => {
    cancelReturn();
    returnTimer.current = setTimeout(() => {
      returnTimer.current = null;
      setAngle(null);
    }, BEAN_RETURN_DELAY_MS);
  }, [cancelReturn]);

  const turnGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      dragged.current = false;
      return false;
    },
    onMoveShouldSetPanResponderCapture: (_, { dx, dy, numberActiveTouches }) =>
      numberActiveTouches === 1 && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5,
    onPanResponderGrant: () => {
      dragged.current = true;
      cancelReturn();
      dragStart.current = pivot.current?.rotation.y ?? 0;
      setAngle(dragStart.current);
    },
    onPanResponderMove: (_, { dx, numberActiveTouches }) => {
      if (numberActiveTouches !== 1) return;
      const next = dragStart.current + dx * BEAN_RADIANS_PER_POINT;
      setAngle(Math.atan2(Math.sin(next), Math.cos(next)));
    },
    onPanResponderRelease: scheduleReturn,
    onPanResponderTerminate: scheduleReturn,
  }), [cancelReturn, scheduleReturn]);

  useEffect(() => {
    if (!rendering) {
      cancelReturn();
      setAngle(null);
    }
    return cancelReturn;
  }, [cancelReturn, rendering]);

  const reduceAnimation = respectReducedMotion && reduced;
  return <View collapsable={false} pointerEvents={rendering ? 'auto' : 'none'} style={{ height, width: '100%' }} accessibilityLabel="Personagem Bóra e progresso da meta diária">
    <EnergyHalo physical={greenProgress} mental={blueProgress} />
    {hasOpened && <Boundary beanPreview={beanPreview}><Suspense fallback={<Copy>Preparando seu avatar…</Copy>}><AvatarViewport beanPreview={beanPreview} beanTurn={onPress ? { pivot, angle, reduceAnimation } : undefined} appearance={appearance} showPlatform={showPlatform} zoom={zoom} motion={motion} motionRequest={motionRequest} rendering={rendering} playing={playing && !reduceAnimation} speed={speed} greenProgress={greenProgress} blueProgress={blueProgress} /></Suspense></Boundary>}
    {hasOpened && rendering && onPress && <View style={styles.beanTouchTarget} {...turnGesture.panHandlers}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Acenar para o Bean"
        accessibilityState={{ disabled: reduceAnimation }}
        disabled={reduceAnimation}
        onPress={({ nativeEvent }) => {
          // The browser can dispatch a click even after the responder was transferred.
          const keyboardClick = 'detail' in nativeEvent && nativeEvent.detail === 0;
          if (Platform.OS !== 'web' || !dragged.current || keyboardClick) onPress();
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  beanTouchTarget: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
    width: '48%',
    maxWidth: 180,
    height: '46%',
    ...Platform.select({ web: { touchAction: 'pan-y' } }),
  },
});
