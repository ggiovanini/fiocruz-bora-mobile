import { OrganizationStatus } from './InstitutionalAccess';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { useRouter } from 'expo-router';
import { Card, Copy, Flow } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';
import { apiEnabled } from '@/api/session';
import { useLevelPreview } from './levels/useLevelPreview';
import { BeanImage } from './avatar/BeanImage';
export function Profile() {
 const router = useRouter();
 const { state } = useMock();
 const evolution = useLevelPreview();
 return <Flow title="Meu perfil">
   <BeanImage size={120}/>
   <Copy>{state.name}</Copy><Copy muted>{state.organization}</Copy>
   {apiEnabled && <OrganizationStatus />}
   <Card><Copy>Nível {evolution.level} · {evolution.vitality} PV</Copy><Copy muted>{evolution.totalEarnedEV} EV acumulados{!apiEnabled ? ' · Exemplo' : ''}</Copy></Card>
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
     {([{ label: 'Evolução', icon: 'bolt', path: '/levels' }, { label: 'Constância', icon: 'leaf', path: '/constancy' }, ...(apiEnabled ? [{ label: 'Medalhas', icon: 'trophy', path: '/medals' } as const] : []), { label: 'Configurações', icon: 'menu', path: './settings' }] as const).map(item => <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path)} style={{ width: '47%', minHeight: 74, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name={item.icon}/><Text style={{ color: colors.text, fontSize: 13 }}>{item.label}</Text></Pressable>)}
   </View>
 </Flow>;
}
