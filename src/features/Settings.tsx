import { OrganizationStatus } from './InstitutionalAccess';
import { View } from 'react-native';
import { Chip } from '@/components/ActivityUI';
import { Sheet } from '@/ui/Sheet';
import {useNotifications} from '@/notifications/NotificationProvider';
import { apiEnabled } from "@/api/session";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Card, Copy, Flow } from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";

export default function Settings() {
  const router = useRouter();
  const { state, dispatch, api } = useMock();
  const notifications = useNotifications();
  const [section, setSection] = useState<'account' | 'app' | 'help'>('account');
  const [confirm, setConfirm] = useState(false);
  return (
    <Flow title="Configurações">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{([{ id: 'account', label: 'Conta' }, { id: 'app', label: 'Aplicativo' }, { id: 'help', label: 'Ajuda' }] as const).map(item => <Chip key={item.id} label={item.label} selected={section === item.id} onPress={() => setSection(item.id)}/>)}</View>
      {section === 'account' && <>

      {apiEnabled && <>
        <Button secondary title={api.busy ? 'Atualizando…' : 'Atualizar minha jornada'} disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
        <OrganizationStatus />
        {api.data.memberships.length > 0 && <Card title="Registrar minhas atividades em">
          <Copy muted>Sua evolução pessoal segue com você. Para participar das ações de uma organização, selecione-a e confira os termos da sua participação.</Copy>
          <Button secondary={state.membershipId !== 'personal'} title="Jornada pessoal" disabled={api.busy || state.membershipId === 'personal'} onPress={() => { void api.selectMembership('personal').catch(() => {}); }} />
          {api.data.memberships.map(member => <Button key={member.id} secondary={state.membershipId !== member.id} title={member.organization_name} disabled={api.busy || state.membershipId === member.id} onPress={() => { void api.selectMembership(member.id).catch(() => {}); }} />)}
        </Card>}
        <Button secondary title="Minha meta diária" onPress={() => router.push('/goal')} />
      </>}
      <Button
        secondary
        title="Editar perfil"
        onPress={() => router.push("/edit-profile")}
      />
      </>}
      {section === 'app' && <>
      <Button secondary title="Permissões do aparelho" onPress={() => router.push('/permissions')} />
      <Button
        secondary
        title="Conexão de treinos"
        onPress={() => router.push("/health-settings")}
      />
      <Button
        secondary
        title="Preferências e privacidade"
        onPress={() => router.push("/privacy")}
      />
      {apiEnabled && <Button secondary title="Minhas equipes" onPress={() => router.push('/teams')} />}
      {apiEnabled && <Button secondary title={`Caixa de mensagens${notifications.unread ? ` (${notifications.unread} não lidas)` : ''}`} onPress={() => router.push('/notifications')} />}
      <Button secondary title="Avisos do aparelho" onPress={() => router.push('/notification-settings')} />
      </>}
      {section === 'help' && <>
      <Button
        secondary
        title="Rever apresentação inicial"
        onPress={() => router.push("/presentation")}
      />
      <Button secondary title="Sobre o Bóra" onPress={() => router.push("/about")} />
      <Button
        secondary
        title="Ajuda e suporte"
        onPress={() => router.push("/help")}
      />
      {__DEV__ && !apiEnabled && <Button
        secondary
        title="Ferramentas de desenvolvimento"
        onPress={() => router.push("/demo")}
      />}
      </>}
      <Button
        secondary
        title="Sair da conta"
        onPress={() => setConfirm(true)}
      />
      <Sheet visible={confirm} title="Sair do Bóra?" onClose={() => setConfirm(false)}>
          <Copy>
            Você precisará entrar novamente para continuar sua jornada.
          </Copy>
          <Button
            title="Confirmar saída"
            onPress={() =>
              dispatch({
                type: "patch",
                value: { session: "signedOut", resumePath: null },
              })
            }
          />
          <Button
            secondary
            title="Continuar no aplicativo"
            onPress={() => setConfirm(false)}
          />
      </Sheet>
    </Flow>
  );
}
