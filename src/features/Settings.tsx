import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { OrganizationStatus } from './InstitutionalAccess';
import {useNotifications} from '@/notifications/NotificationProvider';
import { apiEnabled } from "@/api/session";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Flow } from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";

export default function Settings() {
  const router = useRouter();
  const { api } = useMock();
  const notifications = useNotifications();
  const [section, setSection] = useState<'account' | 'app' | 'help'>('account');
  return (
    <Flow title="Configurações">
      <SegmentedTabs label="Seções de configurações" options={[{ id: 'account', label: 'Conta' }, { id: 'app', label: 'Aplicativo' }, { id: 'help', label: 'Ajuda' }]} value={section} onChange={setSection}/>
      {section === 'account' && <>

      {apiEnabled && <>
        <Button secondary title={api.busy ? 'Atualizando…' : 'Atualizar minha jornada'} disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
        <OrganizationStatus />
        <Button secondary title="Minha meta diária" onPress={() => router.push('/goal')} />
      </>}
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
      {apiEnabled && <Button secondary title="Equipes" onPress={() => router.push('/teams')} />}
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

    </Flow>
  );
}
