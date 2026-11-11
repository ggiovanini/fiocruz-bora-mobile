import { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { apiEnabled } from '@/api/session';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { useNotifications } from '@/notifications/NotificationProvider';
import { Button, Copy, Flow, Notice } from '@/ui/Flow';

export default function NotificationSettings() {
  const notifications=useNotifications();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const pending=useRef(false);
  const native=Platform.OS!=='web';
  async function run(action:()=>Promise<unknown>) {
    if(pending.current)return;
    pending.current=true;setBusy(true);setError('');
    try { await action(); }
    catch { setError('Não foi possível ajustar os avisos. Tente novamente.'); }
    finally { pending.current=false;setBusy(false); }
  }
  return <Flow title="Avisos do aparelho" centered footer={native && apiEnabled ? <Button title={notifications.enabled ? 'Desativar avisos' : 'Ativar avisos'} disabled={busy} busy={busy} onPress={()=>{void run(()=>notifications.enabled ? notifications.disable() : notifications.enable());}}/> : undefined}>
    <View style={s.status}>
      <View style={[s.icon,notifications.enabled&&s.active]}><Icon name="bell" size={44} color={notifications.enabled ? colors.lime : colors.primary}/></View>
      <Text style={s.title}>{notifications.enabled ? 'Avisos ativados' : 'Avisos desativados'}</Text>
      <Text style={s.description}>Suas mensagens continuam na caixa de entrada, mesmo com os avisos desativados.</Text>
    </View>
    {!native ? <Notice>Os avisos do sistema estão disponíveis no app instalado.</Notice> : !apiEnabled ? <Notice>Conecte o app ao serviço para ativar os avisos.</Notice> : <>
      <Copy muted>Os avisos aparecem com o app em uso. Som e apresentação seguem os ajustes do aparelho.</Copy>
      <Button secondary title="Testar aviso" disabled={busy || !notifications.enabled} onPress={()=>{void run(notifications.test);}}/>
      <Button secondary title="Abrir ajustes do aparelho" disabled={busy} onPress={()=>{void run(()=>Linking.openSettings());}}/>
    </>}
    {!!(error || notifications.error) && <Notice>{error || notifications.error}</Notice>}
  </Flow>;
}
const s=StyleSheet.create({
  status:{alignItems:'center',gap:16,paddingVertical:16},
  icon:{width:96,height:96,borderRadius:32,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},
  active:{borderColor:colors.lime},
  title:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:21,textAlign:'center'},
  description:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:14,lineHeight:22,textAlign:'center'},
});
