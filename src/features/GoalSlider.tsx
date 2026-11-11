import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { colors } from '@/design/tokens';
import { clampDailyGoal, goalAtPosition, MAX_DAILY_GOAL, MIN_DAILY_GOAL } from './goalRange';

export function GoalSlider({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const [width, setWidth] = useState(0);
  const track = useRef<View>(null);
  const origin = useRef(0);
  const dragging = useRef(false);
  const progress = (value - MIN_DAILY_GOAL) / (MAX_DAILY_GOAL - MIN_DAILY_GOAL);
  function move(event: GestureResponderEvent) {
    if (!disabled) onChange(goalAtPosition(event.nativeEvent.pageX - origin.current - 14, width - 28));
  }
  function adjust(next: number) { if (!disabled) onChange(clampDailyGoal(next)); }
  return <View style={{ gap: 4, opacity: disabled ? 0.5 : 1 }}>
    <Text style={s.label}>Meta em EV por dia</Text>
    <Text style={s.value}>{value}<Text style={s.unit}> EV</Text></Text>
    <View ref={track} accessible accessibilityRole="adjustable" accessibilityLabel="Meta diária em EV"
      accessibilityState={{ disabled }} accessibilityValue={{ min: MIN_DAILY_GOAL, max: MAX_DAILY_GOAL, now: value, text: `${value} EV` }}
      accessibilityActions={[{ name: 'increment', label: 'Aumentar meta' }, { name: 'decrement', label: 'Diminuir meta' }]}
      onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'increment') adjust(value + 1); if (event.nativeEvent.actionName === 'decrement') adjust(value - 1); }}
      {...(Platform.OS === 'web' ? { tabIndex: disabled ? -1 : 0, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
        const next = { ArrowRight: value + 1, ArrowUp: value + 1, ArrowLeft: value - 1, ArrowDown: value - 1, Home: MIN_DAILY_GOAL, End: MAX_DAILY_GOAL }[event.key];
        if (next !== undefined) { event.preventDefault(); adjust(next); }
      } } : {})}
      onLayout={event => { setWidth(event.nativeEvent.layout.width); }}
      onStartShouldSetResponder={() => !disabled}
      onResponderGrant={event => {
        dragging.current = true;
        const pageX = event.nativeEvent.pageX;
        track.current?.measureInWindow(x => {
          origin.current = x;
          if (dragging.current && !disabled) onChange(goalAtPosition(pageX - x - 14, width - 28));
        });
      }}
      onResponderMove={move} onResponderRelease={() => { dragging.current = false; }} onResponderTerminate={() => { dragging.current = false; }}
      style={s.touchArea}>
      <View pointerEvents="none" style={s.rail}><View style={[s.fill, { width: `${progress * 100}%` }]} /></View>
      <View pointerEvents="none" style={[s.thumb, { left: progress * Math.max(0, width - 28) }]} />
    </View>
    <View style={s.limits}><Text style={s.limit}>{MIN_DAILY_GOAL} EV</Text><Text style={s.limit}>{MAX_DAILY_GOAL} EV</Text></View>
  </View>;
}
const s = StyleSheet.create({
  label: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  value: { color: colors.lime, fontFamily: 'Montserrat_700Bold', fontSize: 36, textAlign: 'center', marginTop: 8 },
  unit: { fontSize: 16 }, touchArea: { height: 48, justifyContent: 'center' },
  rail: { height: 6, marginHorizontal: 14, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.lime },
  thumb: { position: 'absolute', width: 28, height: 28, top: 10, borderRadius: 14, backgroundColor: colors.lime, borderWidth: 3, borderColor: colors.background },
  limits: { flexDirection: 'row', justifyContent: 'space-between' },
  limit: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 12 },
});
