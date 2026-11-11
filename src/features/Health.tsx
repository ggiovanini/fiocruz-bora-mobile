import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useHealthImports } from '@/health/HealthImportProvider';
import { useHealth } from '@/health/HealthProvider';
import { Button, Copy, Flow, Notice, Placeholder } from '@/ui/Flow';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import HealthWorkoutImport from './HealthWorkoutImport';

export default function Health() {
  const router = useRouter();
  const imports=useHealthImports();
  const { session, state, adapter, ready, preferenceError } = useHealth();
  const native = Platform.OS === 'ios' || Platform.OS === 'android';
  const workouts = state.snapshot?.workouts ?? [];
  return <Flow title="Treinos do aparelho" demo={false}>
    <View style={s.toolbar}>
      <View style={s.status}><Icon name="phone" size={20}/><Copy muted>{adapter.label} · {state.connected ? 'Conectado' : 'Não conectado'}</Copy></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Configurar conexão de treinos" onPress={() => router.push('/health-settings')} style={s.settings}><Icon name="menu" size={22}/><Text style={s.label}>Conexão</Text></Pressable>
    </View>
    {!native ? <Placeholder>Consulte os treinos no aplicativo instalado em um iPhone ou Android compatível.</Placeholder>
      : !ready ? <Copy muted>Carregando conexão…</Copy>
      : !state.connected ? <>
        {!!state.message && <Notice>{state.message}</Notice>}
        <Placeholder>Conecte o {adapter.label} para consultar seus treinos dos últimos sete dias.</Placeholder>
        <Button title="Configurar conexão" onPress={() => router.push('/health-settings')}/>
      </> : <>
        <View style={s.summary}><Copy>{state.snapshot ? `${workouts.length} ${workouts.length === 1 ? 'treino disponível' : 'treinos disponíveis'}` : 'Treinos disponíveis'}</Copy><Copy muted>Últimos 7 dias</Copy></View>
        {state.automaticImport && <Copy muted>{state.automatic ? 'Envio automático autorizado.' : 'Envio automático pausado: ative a atualização automática.'}</Copy>}
        {workouts.some(workout=>['review','failed'].includes(imports.statuses[workout.id]?.status)) && <Copy muted>Há treinos que precisam de revisão. Toque para conferir.</Copy>}
        <Button secondary title="Atualizar treinos" busy={state.busy} disabled={!ready} onPress={() => { void session.sync(); }}/>
        {!!state.message && (!state.snapshot || !workouts.length) && <Notice>{state.message}</Notice>}
        {state.busy ? <Copy muted>Consultando treinos…</Copy> : state.snapshot ? <>
          <Copy muted>Atualizado em {new Date(state.snapshot.syncedAt).toLocaleString('pt-BR')}.</Copy>
          {!workouts.length && <Placeholder>Nenhum treino disponível neste período. Confira as fontes e permissões em Conexão.</Placeholder>}
          {workouts.map(workout => <HealthWorkoutImport key={workout.id} workout={workout}/>)}
        </> : <Placeholder>Toque em Atualizar treinos para consultar o aparelho.</Placeholder>}
      </>}
    <Button secondary title="Ver exemplo com treinos fictícios" onPress={()=>router.push('/health-preview')}/>
    {preferenceError && <Notice>Não foi possível salvar suas preferências. Confira os ajustes em Conexão.</Notice>}
  </Flow>;
}
const s = StyleSheet.create({ toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 }, status: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, settings: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', gap: 4 }, label: { color: colors.text, fontSize: 11, fontFamily: 'Montserrat_500Medium' }, summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 } });
