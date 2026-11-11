import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Platform } from 'react-native';
import { Button, Check, Copy, Flow, Notice } from '@/ui/Flow';
import { useHealth } from '@/health/HealthProvider';
import { healthConnectionCopy } from './health/connectionCopy';

export default function HealthSettings() {
  const { session, state, adapter, ready, preferenceError } = useHealth();
  const router = useRouter();
  const [error, setError] = useState('');
  const native = Platform.OS === 'ios' || Platform.OS === 'android';
  async function connect() {
    if (!ready || state.busy) return;
    session.setAutomatic(true);
    session.setAutomaticImport(true);
    await session.connect();
  }
  return <Flow title="Conexão de treinos" demo={false} centered footer={native && !state.connected ? <Button title="Conectar e autorizar" busy={state.busy} disabled={!ready || state.busy} onPress={()=>{void connect();}}/> : undefined}>
    <Copy>{state.connected ? `${adapter.label} conectado.` : healthConnectionCopy.description}</Copy>
    <Copy muted>{healthConnectionCopy.detail}</Copy>
    <Copy muted>{healthConnectionCopy.control}</Copy>
    {!native ? <Copy muted>A conexão está disponível no app instalado em um iPhone ou Android compatível.</Copy> : <>
      {state.connected && <>
        <Check label="Atualização automática" value={state.automatic} disabled={!ready || state.busy} onChange={value=>session.setAutomatic(value)}/>
        <Check label="Envio automático dos treinos" value={state.automaticImport} disabled={!ready || state.busy} onChange={value=>session.setAutomaticImport(value)}/>
        <Button secondary title="Ver atividades" onPress={()=>router.navigate('/health')}/>
        <Button secondary title="Desconectar" disabled={state.busy} onPress={()=>session.disconnect()}/>
      </>}
      {state.availability==='update-required' && <Button secondary title="Instalar ou atualizar Health Connect" onPress={()=>{void Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata').catch(()=>setError('Não foi possível abrir a loja. Procure Health Connect na Play Store.'));}}/>}
      <Button secondary title="Permissões no dispositivo" disabled={state.busy} onPress={()=>{session.clearReadings();void adapter.managePermissions().catch(()=>setError('Abra os ajustes do Saúde ou do Health Connect e procure Bóra para alterar as permissões.'));}}/>
      <Copy muted>Desconectar interrompe a consulta e o envio de novos treinos. Para revogar o acesso, altere as permissões no dispositivo.</Copy>
      {!!state.message && <Notice>{state.message}</Notice>}
      {preferenceError && <Notice>Não foi possível salvar suas preferências. Confira a conexão ao reabrir o app.</Notice>}
      {!!error && <Notice>{error}</Notice>}
    </>}
  </Flow>;
}
