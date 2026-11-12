import { useState } from 'react';
import { Sheet } from '@/ui/Sheet';
import { OrganizationStatus, ProfileDetail, ParticipationBadge } from './InstitutionalAccess';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { useRouter } from 'expo-router';
import { Button, Copy, Flow } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';
import { apiEnabled } from '@/api/session';
import { useLevelPreview } from './levels/useLevelPreview';
import { LevelSummary } from './levels/Levels';
export function Profile() {
 const router = useRouter();
 const { state, dispatch, api } = useMock();
 const [confirm, setConfirm] = useState(false);
 const evolution = useLevelPreview();
 return <Flow title="Meu perfil">
   <LevelSummary vitality={evolution.vitality} level={apiEnabled ? api.data.energy?.vitality.level?.number ?? null : evolution.level} progress={evolution.progress} maximum={apiEnabled && !!api.data.energy?.vitality.level && !api.data.energy.vitality.level.next} />
   <ProfileDetail label="Nome"><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ flexShrink: 1 }}><Copy>{state.name}</Copy></View><Pressable accessibilityRole="button" accessibilityLabel="Editar nome" onPress={() => router.push('/edit-profile')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="edit" size={19}/></Pressable></View></ProfileDetail>
   {!apiEnabled && <ProfileDetail label="Organização"><Copy>{state.organization}</Copy><ParticipationBadge label="Demonstração" tone="neutral" icon="user" /></ProfileDetail>}
   {apiEnabled && <OrganizationStatus />}
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
     {([{ label: 'Evolução', icon: 'bolt', path: '/levels' }, { label: 'Meu ritmo', icon: 'leaf', path: '/constancy' }, ...(apiEnabled ? [{ label: 'Medalhas', icon: 'trophy', path: '/medals' } as const] : []), { label: 'Configurações', icon: 'settings', path: './settings' }] as const).map(item => <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path)} style={{ width: '47%', minHeight: 74, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name={item.icon}/><Text style={{ color: colors.text, fontSize: 13 }}>{item.label}</Text></Pressable>)}
   </View>
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
 </Flow>;
}
