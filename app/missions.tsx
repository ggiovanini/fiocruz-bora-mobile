import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/design/Screen';
import { colors, radius, spacing } from '@/design/tokens';

export default function MissionsScreen() { return <Screen><Text style={styles.title}>Missões</Text><View style={styles.card}><Text style={styles.heading}>Primeiro passo</Text><Text style={styles.description}>As campanhas da Cogetic aparecerão aqui quando forem publicadas.</Text></View></Screen>; }
const styles = StyleSheet.create({ title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: spacing.md }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg }, heading: { color: colors.text, fontSize: 18, fontWeight: '700' }, description: { color: colors.muted, fontSize: 16, lineHeight: 22, marginTop: spacing.sm } });
