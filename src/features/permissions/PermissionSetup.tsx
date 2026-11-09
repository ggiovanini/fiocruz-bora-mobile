import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, AppState, Linking, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { Brand } from '@/components/Brand';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
import { hasAccess, useMock } from '@/mocks/MockProvider';
import { useNotifications } from '@/notifications/NotificationProvider';
import { finishPermissionExplanation, nextPermissionStep, readPermissionChoices, type PermissionChoices, type PermissionStep } from './introStorage';

const copy = {
  notifications: { title: 'Podemos dar um toque?', description: 'Permita as notificações para ver os avisos do Bóra neste aparelho.', detail: 'Por enquanto, os avisos aparecem com o app em uso. Suas mensagens também ficam guardadas na caixa de entrada.', button: 'Permitir notificações', icon: 'bell' as const },
  camera: { title: 'Bóra facilitar os encontros?', description: 'Com a câmera, você lê o QR Code dos eventos e confirma sua presença rapidinho.', detail: 'A câmera só abre quando você escolhe ler um código. Você também pode digitar o código do evento.', button: 'Permitir câmera', icon: 'qr' as const },
};

function Explanation({ step, onComplete }: { step: PermissionStep; onComplete: (choices: PermissionChoices) => void }) {
  const inbox = useNotifications();
  const [permission, requestCamera] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const finish = async (allow: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      // Persist before opening the system dialog, including an app interruption or process restart.
      const choices = await finishPermissionExplanation(AsyncStorage, step);
      if (allow && Platform.OS !== 'web') {
        if (step === 'notifications') await inbox.enable(false);
        else if (!permission?.granted && permission?.canAskAgain !== false) await requestCamera();
      }
      if (mounted.current) onComplete(choices);
    } catch {
      if (mounted.current) setError('Não deu para concluir agora. Você pode tentar de novo ou deixar para depois.');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const content = copy[step];
  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.body}>
      <View style={s.brand}><Brand /></View>
      <Text style={s.step}>{step === 'notifications' ? '1 de 2' : '2 de 2'}</Text>
      <View style={s.icon}><Icon name={content.icon} size={48} color={colors.lime} /></View>
      <Text accessibilityRole="header" style={s.title}>{content.title}</Text>
      <Text style={s.description}>{content.description}</Text>
      <Text style={s.detail}>{content.detail}</Text>
      <Text style={s.detail}>Você decide. Dá para mudar isso depois em Configurações → Permissões do aparelho.</Text>
      {Platform.OS === 'web' && <Notice>Você pode ativar essas permissões no app instalado no celular. Por aqui, é só continuar.</Notice>}
      {!!error && <Notice>{error}</Notice>}
      {Platform.OS !== 'web' && <Button title={busy ? 'Só um instante…' : content.button} disabled={busy} onPress={() => { void finish(true); }} />}
      <Button secondary title={Platform.OS === 'web' ? 'Continuar' : 'Agora não'} disabled={busy} onPress={() => { void finish(false); }} />
    </ScrollView>
  </SafeAreaView>;
}

const SetupComplete = createContext(false);
export const usePermissionSetupComplete = () => useContext(SetupComplete);

export function FirstPermissionSetup({ children }: PropsWithChildren) {
  const { state } = useMock();
  const [choices, setChoices] = useState<PermissionChoices | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    void readPermissionChoices(AsyncStorage).then(setChoices).catch(() => setError(true));
  };
  useEffect(load, []);
  const content = <SetupComplete.Provider value={!!choices && !nextPermissionStep(choices)}>{children}</SetupComplete.Provider>;
  if (!hasAccess(state)) return content;
  const step = choices ? nextPermissionStep(choices) : null;
  if (choices && !step) return content;
  // Keep the Expo navigator mounted while this introduction covers the app.
  return <>{content}<Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
    {!choices ? <SafeAreaView style={s.safe}><View style={s.body}>{error ? <><Notice>Não conseguimos ler suas preferências neste aparelho.</Notice><Button title="Tentar de novo" onPress={load} /></> : <ActivityIndicator color={colors.lime} accessibilityLabel="Preparando suas preferências" />}</View></SafeAreaView>
      : step && <Explanation key={step} step={step} onComplete={setChoices} />}
  </Modal></>;

}

export default function DevicePermissions() {
  const router=useRouter();
  const inbox = useNotifications();
  const [camera, requestCamera, refreshCamera] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const listener = AppState.addEventListener('change', next => { if (next === 'active') void refreshCamera(); });
    return () => listener.remove();
  }, [refreshCamera]);
  const cameraAction = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (camera?.granted || camera?.canAskAgain === false) await Linking.openSettings();
      else await requestCamera();
    } catch { setError('Não conseguimos abrir as permissões. Tente de novo nos ajustes do aparelho.'); }
    finally { setBusy(false); }
  };
  return <Flow title="Permissões do aparelho">
    <Copy>Você escolhe o que combina com a sua jornada. Deixar uma permissão para depois não impede você de usar o Bóra.</Copy>
    <Card title="Avisos do aparelho">
      <Copy muted>{inbox.enabled ? 'Avisos ativados neste aparelho.' : 'Avisos desativados neste aparelho.'}</Copy>
      <Button secondary title="Ajustar avisos" onPress={()=>router.push('/notification-settings')}/>
    </Card>
    <Card title="Câmera"><Copy>{copy.camera.description}</Copy><Copy muted>{copy.camera.detail}</Copy>
      <Copy muted>{camera?.granted ? 'Câmera permitida.' : 'A câmera ainda não está permitida.'}</Copy>
      {Platform.OS !== 'web' ? <Button secondary title={camera?.granted || camera?.canAskAgain === false ? 'Abrir ajustes da câmera' : 'Permitir câmera'} disabled={busy} onPress={() => { void cameraAction(); }} /> : <Copy muted>Disponível no app instalado no celular.</Copy>}
    </Card>
    {!!error && <Notice>{error}</Notice>}
  </Flow>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 28, justifyContent: 'center', gap: 24 },
  brand: { alignItems: 'center', marginBottom: 8 }, step: { textAlign: 'center', fontFamily: 'Montserrat_500Medium', fontSize: 11, color: colors.muted },
  icon: { width: 110, height: 110, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: colors.surface },
  title: { color: colors.text, fontFamily: 'Montserrat_700Bold', fontSize: 28, lineHeight: 37, textAlign: 'center' },
  description: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 25, textAlign: 'center' },
  detail: { color: '#AFC9D7', fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 21, textAlign: 'center' },
});
