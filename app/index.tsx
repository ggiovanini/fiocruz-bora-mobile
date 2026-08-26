import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/design/PrimaryButton';
import { Screen } from '@/design/Screen';
import { colors, radius, spacing } from '@/design/tokens';
import { track } from '@/telemetry/telemetry';

export default function HomeScreen() {
  return <Screen><Text style={styles.eyebrow}>BÓRA</Text><Text style={styles.title}>Sua jornada de equilíbrio começa hoje.</Text><View style={styles.card}><Text style={styles.label}>ENERGIA VITAL</Text><Text style={styles.energy}>0 EV</Text><Text style={styles.description}>Registre uma atividade, conclua uma missão ou participe de um evento.</Text></View><PrimaryButton onPress={() => track('activity_record_started')}>Registrar atividade</PrimaryButton></Screen>;
}
const styles = StyleSheet.create({ eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: spacing.md }, title: { color: colors.text, fontSize: 30, fontWeight: '800', lineHeight: 38, marginTop: spacing.sm }, card: { backgroundColor: colors.accent, borderRadius: radius.lg, marginVertical: spacing.xl, padding: spacing.lg }, label: { color: colors.muted, fontSize: 12, fontWeight: '700' }, energy: { color: colors.primary, fontSize: 40, fontWeight: '800', marginVertical: spacing.sm }, description: { color: colors.text, fontSize: 16, lineHeight: 22 } });
