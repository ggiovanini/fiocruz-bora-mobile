import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';

type Tab<Value extends string> = { id: Value; label: string };

type Props<Value extends string> = {
  label: string;
  options: readonly Tab<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

/** Shared in-screen tabs; labels wrap to remain readable on narrow screens. */
export function SegmentedTabs<Value extends string>({ label, options, value, onChange }: Props<Value>) {
  return <View accessibilityRole="tablist" accessibilityLabel={label} style={s.tabs}>
    {options.map(tab => <Pressable
      key={tab.id}
      accessibilityRole="tab"
      accessibilityState={{ selected: value === tab.id }}
      onPress={() => onChange(tab.id)}
      style={({ pressed }) => [s.tab, value === tab.id && s.active, pressed && s.pressed]}
    >
      <Text style={[s.text, value === tab.id && s.selected]}>{tab.label}</Text>
    </Pressable>)}
  </View>;
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: colors.surface, gap: 4 },
  tab: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  active: { backgroundColor: colors.background },
  text: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 20, textAlign: 'center', flexShrink: 1 },
  selected: { color: colors.primary, fontFamily: 'Montserrat_700Bold' },
  pressed: { opacity: 0.7 },
});
