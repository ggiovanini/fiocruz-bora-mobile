import {useNotifications} from '@/notifications/NotificationProvider';
import { apiEnabled } from "@/api/session";
import { ParticipantAvatar } from "./avatar/ParticipantAvatar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Card, Copy, Flow } from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";
import { useLevelPreview } from "./levels/useLevelPreview";

export function Profile() {
  const router = useRouter();
  const { state, dispatch, api } = useMock();
  const evolution = useLevelPreview();
  const notifications = useNotifications();
  const [confirm, setConfirm] = useState(false);
  return (
    <Flow title="Meu perfil">
      <ParticipantAvatar />
      <Copy>{state.name}</Copy>
      <Copy muted>Seu personagem Bóra · modelo padrão para todos.</Copy>
      <Copy muted>{state.organization}</Copy>
      <Card title="Sua evolução">
        {!apiEnabled && <Copy>{state.activities.filter(a => a.status === 'confirmed').length} atividade(s) confirmada(s)</Copy>}
        <Copy>{evolution.totalEarnedEV} EV acumulados · preservados no histórico.</Copy>
        <Copy muted>Nível {evolution.level} · {evolution.vitality} PV de Vitalidade.{!apiEnabled && ' Dados de exemplo.'}</Copy>
      </Card>
      {apiEnabled && <>
        <Button secondary title={api.busy ? 'Atualizando…' : 'Atualizar minha jornada'} disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
        {api.data.memberships.length > 1 && <Card title="Sua organização">
          {api.data.memberships.map(member => <Button key={member.id} secondary={state.membershipId !== member.id} title={member.organization_name} disabled={api.busy || state.membershipId === member.id} onPress={() => { void api.selectMembership(member.id).catch(() => {}); }} />)}
        </Card>}
        <Button secondary title="Minha meta diária" onPress={() => router.push('/goal')} />
      </>}
      <Button secondary title="Meu nível" onPress={() => router.push('/levels')} />
      <Button
        secondary
        title="Minha constância"
        onPress={() => router.push("/constancy")}
      />
      <Button
        secondary
        title="Editar perfil"
        onPress={() => router.push("/edit-profile")}
      />
      <Button
        secondary
        title="Conectar dados de atividade"
        onPress={() => router.push("/health")}
      />
      <Button
        secondary
        title="Preferências e privacidade"
        onPress={() => router.push("/privacy")}
      />
      {apiEnabled && <Button secondary title="Minhas equipes" onPress={() => router.push('/teams')} />}
      {apiEnabled && <Button secondary title="Minhas medalhas" onPress={() => router.push('/medals')} />}
      {apiEnabled && <Button secondary title={`Minhas notificações${notifications.unread ? ` (${notifications.unread} não lidas)` : ''}`} onPress={() => router.push('/notifications')} />}
      <Button
        secondary
        title="Rever apresentação inicial"
        onPress={() => router.push("/presentation")}
      />
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
      <Button
        secondary
        title="Sair da conta"
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Card title="Sair do Bóra?">
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
        </Card>
      )}
    </Flow>
  );
}
