import { useRouter } from 'expo-router';
import { usePagedResource } from '@/api/usePagedResource';
import { StyleSheet, Text, View } from 'react-native';
import { useMock } from '@/mocks/MockProvider';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { newDraft } from '@/mocks/model';
import { MedalBadge } from './MedalBadge';
type Challenge = {
  id: string; title: string; description: string; metric: string; target: number; progress: number; progress_percent: number;
  starts_on: string; ends_on: string; activity_type: string | null; activity_name: string | null; period_status: 'active' | 'upcoming' | 'ended'; completed: boolean;
  medal: { name: string; description: string; style: string; image_url?: string | null; earned: boolean };
};
const units: Record<string, string> = { minutes: 'min', activities: 'atividades', ev: 'EV' };
const date = (value: string) => value.split('-').reverse().join('/');
export default function Challenges() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const { items, busy, error, more, refresh, loadMore } = usePagedResource<Challenge>(`/memberships/${state.membershipId}/challenges`);
  return <Flow title="Desafios e conquistas" back={false}>
    <Copy muted>Uma meta de cada vez. Conclua os desafios e guarde suas medalhas.</Copy>
    <Button secondary title="Minhas medalhas" onPress={() => router.push('/medals')} />
    {!!error && <Notice>{error}</Notice>}
    {busy && <Copy muted>Carregando desafios…</Copy>}
    {!busy && !error && !items.length && <Card title="Sua próxima conquista vem aí"><Copy>Nenhum desafio publicado para sua organização no momento.</Copy></Card>}
    {items.map(challenge => <Card key={challenge.id} title={challenge.title}>
      <Copy muted>{challenge.description}</Copy>
      <Copy muted>{challenge.activity_name ? `Atividade: ${challenge.activity_name}` : 'Todas as atividades aprovadas contam.'}</Copy>
      <MedalBadge imageUrl={challenge.medal.image_url} variant={challenge.medal.style} name={challenge.medal.name} earned={challenge.completed} />
      <Text style={s.medalName}>{challenge.medal.name}</Text>
      <Copy muted>{challenge.medal.description}</Copy>
      <Text style={s.progress}>{challenge.progress} / {challenge.target} {units[challenge.metric]}</Text>
      <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: challenge.progress_percent }}><View style={[s.fill, { width: `${challenge.progress_percent}%` }]} /></View>
      <Copy muted>{date(challenge.starts_on)} a {date(challenge.ends_on)}</Copy>
      {challenge.completed ? <Notice>Medalha conquistada! Ela já está na sua coleção.</Notice>
        : challenge.period_status === 'upcoming' ? <Copy muted>Esse desafio começa em breve.</Copy>
        : challenge.period_status === 'ended' ? <Copy muted>O período deste desafio terminou.</Copy>
        : <Button title="Registrar atividade" onPress={() => {
          if (!state.draft && challenge.activity_type) {
            const item = api.data.catalog.find(item => item.code === challenge.activity_type);
            if (item) dispatch({ type: 'draft', value: { ...newDraft(), type: item.name, activityCode: item.code, date: api.data.energy?.today.date ?? newDraft().date } });
          }
          router.push('/activity');
        }} />}
    </Card>)}
    {more && <Button secondary title="Carregar mais desafios" disabled={busy} onPress={loadMore} />}
    <Button secondary title="Atualizar desafios" disabled={busy} onPress={refresh} />
  </Flow>;
}
const s = StyleSheet.create({ medalName: { textAlign: 'center', fontFamily: 'Montserrat_600SemiBold', color: colors.text, fontSize: 17 }, progress: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 18 }, track: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.border }, fill: { height: '100%', backgroundColor: colors.lime } });
