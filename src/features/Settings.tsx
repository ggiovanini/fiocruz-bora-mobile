import { OrganizationStatus } from './InstitutionalAccess';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';
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
      <View style={s.tabs}>{([{ id: 'account', label: 'Conta' }, { id: 'app', label: 'Aplicativo' }, { id: 'help', label: 'Ajuda' }] as const).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: section === item.id }} onPress={() => setSection(item.id)} style={s.tab}><Text style={[s.tabText, section === item.id && s.tabSelected]}>{item.label}</Text></Pressable>)}</View>
      {section === 'account' && <>

      {apiEnabled && <>
        <Button secondary title={api.busy ? 'Atualizando…' : 'Atualizar minha jornada'} disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />
        <OrganizationStatus />
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

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, paddingHorizontal: 18 },
  tab: { minHeight: 44, justifyContent: 'center' },
  tabText: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  tabSelected: { color: colors.primary, fontFamily: 'Montserrat_700Bold' },
});
