import type { PropsWithChildren } from 'react';
import { useRouter } from 'expo-router';
import { useMock } from '@/mocks/MockProvider';
import { Button, Copy, Flow, Notice } from '@/ui/Flow';

export function InstitutionalAccess({ title, children }: PropsWithChildren<{ title: string }>) {
  const { state, api } = useMock();
  const router = useRouter();
  if (api.data.memberships.some(item => item.id === state.membershipId)) return <>{children}</>;
  const pending = api.data.registrations.find(item => item.status === 'pending');
  return <Flow title={title}>
    <Notice>{pending ? `Só falta confirmar sua participação em ${pending.organization_name}.` : 'Só falta confirmar sua organização para chegar aqui.'}</Notice>
    <Copy>Enquanto isso, sua jornada continua: registre atividades e acompanhe cada passo da sua evolução.</Copy>
    {api.data.memberships.map(item => <Button key={item.id} title={`Usar ${item.organization_name}`} disabled={api.busy} onPress={() => { void api.selectMembership(item.id).catch(() => {}); }} />)}
    <Button secondary title="Minha organização" onPress={() => router.push('/organization')} />
    <Button secondary title="Ver se já foi confirmado" disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
    {!!api.error && <Notice>{api.error}</Notice>}
  </Flow>;
}

export function OrganizationStatus() {
  const { api } = useMock();
  const router = useRouter();
  const pending = api.data.registrations.find(item => item.status === 'pending');
  const rejected = api.data.registrations.find(item => item.status === 'rejected');
  return <>
    {pending ? <Copy muted>{pending.organization_name} · só falta confirmar sua participação</Copy>
      : api.data.memberships.length > 0 ? <Copy muted>Participação confirmada: {api.data.memberships.map(item => item.organization_name).join(', ')}</Copy>
      : rejected ? <Copy muted>Ainda não conseguimos confirmar sua participação em {rejected.organization_name}. Sua jornada continua salva.</Copy>
      : <Copy muted>Por enquanto, sua jornada é pessoal. Você pode escolher uma organização quando quiser.</Copy>}
    <Button secondary title="Minha organização" onPress={() => router.push('/organization')} />
  </>;
}
