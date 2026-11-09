import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';
import { Icon, type IconName } from '@/design/Icon';
import { useRouter } from 'expo-router';
import { useMock } from '@/mocks/MockProvider';
import { Button, Copy, Flow, Notice } from '@/ui/Flow';

export function InstitutionalAccess({ title, children }: PropsWithChildren<{ title: string }>) {
  const { state, api } = useMock();
  const router = useRouter();
  if (api.data.memberships.some(item => item.id === state.membershipId)) return <>{children}</>;
  const pending = api.data.registrations.find(item => item.status === 'pending');
  return <Flow title={title}>
    <Notice>{pending ? `Aguardando aprovação do RH ou administrador de ${pending.organization_name}.` : 'Só falta confirmar sua organização para chegar aqui.'}</Notice>
    <Copy>Enquanto isso, sua jornada continua: registre atividades e acompanhe cada passo da sua evolução.</Copy>
    <Button secondary title="Minha organização" onPress={() => router.push('/organization')} />
    <Button secondary title="Ver se já foi confirmado" disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
    {!!api.error && <Notice>{api.error}</Notice>}
  </Flow>;
}

export function ProfileDetail({ label, children }: PropsWithChildren<{ label: string }>) {
  return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>;
}

export function ParticipationBadge({ label, tone, icon }: { label: string; tone: 'approved' | 'pending' | 'rejected' | 'neutral'; icon: IconName }) {
  const tint = { approved: colors.lime, pending: colors.yellow, rejected: '#FFB4B4', neutral: '#B9D0DD' }[tone];
  const background = { approved: '#164D3F', pending: '#453F23', rejected: '#513644', neutral: colors.accent }[tone];
  return <View accessible accessibilityLabel={label} style={[s.badge, { backgroundColor: background, borderColor: tint }]}>
    <Icon name={icon} color={tint} size={14} /><Text style={[s.badgeText, { color: tint }]}>{label}</Text>
  </View>;
}

export function OrganizationStatus() {
  const { api } = useMock();
  const pending = api.data.registrations.find(item => item.status === 'pending');
  const rejected = api.data.registrations.find(item => item.status === 'rejected');
  const approved = api.data.memberships.length > 0;
  const name = pending?.organization_name ?? (approved ? api.data.memberships.map(item => item.organization_name).join(', ') : rejected?.organization_name);
  return <>
    <ProfileDetail label="Organização">
      <Copy>{name ?? 'Nenhuma organização vinculada'}</Copy>
      {pending ? <>
        <ParticipationBadge label="Aguardando aprovação" tone="pending" icon="clock" />
        <Copy muted>O RH ou administrador da organização precisa aprovar sua participação. Enquanto aguarda, você pode registrar atividades e acompanhar sua evolução.</Copy>
      </> : approved ? <ParticipationBadge label="Participação aprovada" tone="approved" icon="check" />
        : rejected ? <><ParticipationBadge label="Participação não aprovada" tone="rejected" icon="lock" /><Copy muted>Procure o RH ou administrador. Sua jornada continua salva.</Copy></>
        : <><ParticipationBadge label="Sem vínculo" tone="neutral" icon="user" /><Copy muted>Sua jornada é pessoal.</Copy></>}
    </ProfileDetail>
    <Copy muted>A escolha da organização é feita no cadastro. Para alterações, procure o RH ou administrador responsável pelo painel.</Copy>
  </>;
}

const s = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.muted, fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  badge: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, lineHeight: 16, flexShrink: 1 },
});
