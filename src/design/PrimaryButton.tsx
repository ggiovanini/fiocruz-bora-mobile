import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/design/tokens';

export function PrimaryButton({ children, onPress }: PropsWithChildren<{ onPress?: () => void }>) {
  return <Pressable onPress={onPress} style={styles.button}><Text style={styles.label}>{children}</Text></Pressable>;
}

const styles = StyleSheet.create({ button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, padding: spacing.md }, label: { color: colors.surface, fontSize: 16, fontWeight: '700' } });
