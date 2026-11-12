import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';

export type Participant = { id: string; name: string; level?: number | null; vitality_points?: number; is_me?: boolean };

/** The same public profile summary in individual rankings and team details. */
export function ParticipantIdentity({ person }: { person: Participant }) {
  return <View style={s.identity}>
    <View style={s.avatar}><Icon name="user" color={person.is_me ? colors.lime : colors.primary} size={22}/></View>
    <View style={s.name}>
      <Text style={s.title}>{person.name}</Text>
      <View style={s.indicators}>
        <Text style={s.subtitle}>Nível {person.level ?? '—'}</Text>
        <Text accessibilityLabel={`Vitalidade: ${person.vitality_points?.toLocaleString('pt-BR') ?? 'não disponível'} pontos`} style={s.subtitle}>{person.vitality_points?.toLocaleString('pt-BR') ?? '—'} PV</Text>
      </View>
      {person.is_me && <View style={s.badge}><Text style={s.badgeText}>Você</Text></View>}
    </View>
  </View>;
}
const s = StyleSheet.create({
  identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { height: 38, width: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, minWidth: 0, gap: 7 },
  title: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: colors.text },
  indicators: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 16, color: colors.muted },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#173F35' },
  badgeText: { fontFamily: 'Montserrat_500Medium', fontSize: 10, lineHeight: 15, color: colors.lime },
});
