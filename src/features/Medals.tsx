import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
import { MedalBadge } from './MedalBadge';
type Medal = { id: string; name: string; description: string; style: string; image_url?: string | null; challenge_title: string; event_title?: string; awarded_at: string; count: number; history: { id: string; challenge_title: string; event_title?: string; awarded_at: string }[] };
export default function Medals() {
  const { items, busy, error, more, loadMore, refresh } = usePagedResource<Medal>('/me/medals');
  return <Flow title="Minhas medalhas">
    <Copy muted>Cada medalha guarda um momento da sua jornada.</Copy>
    {!!error && <Notice>{error}</Notice>}
    {!busy && !error && !items.length && <Card title="Sua coleção começa com uma conquista"><Copy>Conclua um desafio ou participe de um evento para receber sua primeira medalha digital.</Copy></Card>}
    {items.map(medal => <Card key={medal.id} title={medal.name}>
      <MedalBadge imageUrl={medal.image_url} variant={medal.style} name={medal.name} />
      <Copy>{medal.description}</Copy>
      <Copy>Conquistada {medal.count} {medal.count === 1 ? 'vez' : 'vezes'}</Copy>
      {medal.history?.map(entry => <Copy muted key={entry.id}>{entry.event_title || entry.challenge_title} · {new Date(entry.awarded_at.includes('T') ? entry.awarded_at : entry.awarded_at.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</Copy>)}
      <Copy muted>Conquistada em {new Date(medal.awarded_at.includes('T') ? medal.awarded_at : medal.awarded_at.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</Copy>
    </Card>)}
    {busy && <Copy muted>Carregando medalhas…</Copy>}
    {more && <Button secondary title="Carregar mais medalhas" disabled={busy} onPress={loadMore} />}
    {!!error && <Button title="Tentar novamente" disabled={busy} onPress={refresh} />}
  </Flow>;
}
