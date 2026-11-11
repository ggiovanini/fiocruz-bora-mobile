import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { colors } from '@/design/tokens';
import { Button, Notice } from '@/ui/Flow';

type Props = {
  loading?: boolean; expired: boolean; offline: boolean; error: string;
  onLogin: () => void; onReconnect: () => void;
};
export default function LoginScreen({ loading, expired, offline, error, onLogin, onReconnect }: Props) {
  const { width, height } = useWindowDimensions();
  const artSize = Math.min(width, 480) * 1.5;
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
      <View style={s.logo}><Brand /></View>
      <View style={[s.copy, { marginTop: Math.min(72, Math.max(36, height * 0.075)) }]}>
        <Text accessibilityRole="header" style={s.title}>Bóra{ '\n' }começar?</Text>
        <Text style={s.phrase}>Mexa-se pela mente,{ '\n' }mova-se pela vida.</Text>
      </View>
      {!!error && <View style={s.feedback}><Notice>{error}</Notice></View>}
      {expired && !error && <View style={s.feedback}><Notice>Bom ter você de volta! Entre para continuar de onde parou.</Notice></View>}
      {offline && <View style={s.feedback}><Notice>A conexão deu uma pausa. Tente entrar de novo quando estiver online.</Notice></View>}
      <View style={s.action}><Button title={loading ? 'Entrando…' : 'Entrar com Login Único'} onPress={offline ? onReconnect : onLogin} disabled={loading} /></View>
      <Text style={s.footer}>No seu ritmo. Um passo de cada vez.</Text>
      <View style={[s.hero, { minHeight: artSize * 0.55 }]}>
        <Image source={require('../../../assets/images/bean/bean-login-invite-v1.png')} style={[s.bean, { width: artSize, height: artSize }]} resizeMode="contain" accessible={false} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: 28 },
  logo: { alignItems: 'flex-start', marginHorizontal: 32 },
  copy: { alignItems: 'flex-start', gap: 12, marginHorizontal: 32 },
  title: { fontFamily: 'Montserrat_700Bold', color: colors.text, fontSize: 38, lineHeight: 43, textAlign: 'left', letterSpacing: -0.9 },
  phrase: { fontFamily: 'Montserrat_400Regular', color: '#BBD6E4', fontSize: 15, lineHeight: 23, textAlign: 'left' },
  feedback: { marginHorizontal: 32, marginTop: 16 },
  action: { marginHorizontal: 32, marginTop: 26 },
  footer: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 11, lineHeight: 18, marginHorizontal: 32, marginTop: 15 },
  hero: { flexGrow: 1, width: '100%', overflow: 'hidden', alignItems: 'center', marginTop: 24 },
  bean: { position: 'absolute', top: 0 },
});
