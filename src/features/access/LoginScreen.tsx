import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ActionRow } from '@/components/ActivityUI';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Button, Notice } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';

type Props = {
  expired: boolean; offline: boolean; error: string;
  onLogin: () => void; onReconnect: () => void;
  onMultiple: () => void; onFailure: () => void; onIneligible: () => void; onPresentation: () => void;
};
export default function LoginScreen({ expired, offline, error, onLogin, onReconnect, onMultiple, onFailure, onIneligible, onPresentation }: Props) {
  const [scenarios, setScenarios] = useState(false);
  const { storageError } = useMock();
  return <SafeAreaView style={s.safe}>
    <AppHeader />
    <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
      <View style={s.heading}>
        <Text style={s.eyebrow}>SUA JORNADA DE BEM-ESTAR</Text>
        <Text accessibilityRole="header" style={s.title}>{expired ? 'Bom ter você de volta.' : 'Um momento\npara você.'}</Text>
        <Text style={s.description}>Movimento e mente no seu ritmo. Entre para continuar sua jornada no Bóra.</Text>
      </View>
      <View style={s.hero}>
        <Image source={require('../../../assets/images/welcome-energy.jpg')} style={s.art} resizeMode="cover" accessible={false} />
        <View style={s.heroCopy}><View style={s.heroIcon}><Icon name="leaf" color={colors.lime} size={25} /></View><Text style={s.heroTitle}>Pequenos passos. Mais constância.</Text><Text style={s.heroDescription}>Cada atividade é uma forma de cuidar de você.</Text></View>
      </View>
      {expired && <Notice>Sua sessão de demonstração expirou. Seus rascunhos e registros continuam aqui.</Notice>}
      {storageError && <Notice>Não foi possível salvar neste aparelho. Mantenha o app aberto para preservar a demonstração.</Notice>}
      <View style={s.accessCard}>
        <View style={s.accessHeading}><View style={s.accessIcon}><Icon name="user" size={22} /></View><View style={s.accessText}><Text style={s.accessTitle}>Entrar com a Fiocruz</Text><Text style={s.accessDescription}>Seu acesso institucional, em um só lugar.</Text></View></View>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {offline && <View style={s.offline}><Text accessibilityRole="alert" style={s.offlineText}>Você está sem conexão simulada. Restabeleça a conexão para entrar.</Text><Button title="Restabelecer conexão simulada" secondary onPress={onReconnect} /></View>}
        <Button title={expired ? 'Entrar novamente com a Fiocruz' : 'Continuar com a Fiocruz'} onPress={onLogin} disabled={offline} />
        <View style={s.demoNote}><View style={s.demoDot} /><Text style={s.demoText}>Modo demonstração: esta entrada é simulada. Nenhuma conta ou senha real será acessada.</Text></View>
      </View>
      <View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: scenarios }} onPress={() => setScenarios(value => !value)} style={s.scenarioToggle}>
          <Icon name="menu" size={19} color={colors.muted} /><Text style={s.scenarioTitle}>Cenários de demonstração</Text><View style={{ transform: [{ rotate: scenarios ? '90deg' : '0deg' }] }}><Icon name="arrow" size={17} color={colors.muted} /></View>
        </Pressable>
        {scenarios && <View style={s.scenarios}>
          <Text style={s.scenarioCaption}>Explore os caminhos de entrada do protótipo.</Text>
          <ActionRow icon="play" title="Rever apresentação inicial" description="Conheça novamente as três telas do Bóra." onPress={onPresentation} color={colors.lime} />
          <ActionRow icon="user" title="Mais de um vínculo" description="Escolha entre organizações de exemplo." onPress={onMultiple} />
          <ActionRow icon="clock" title="Falha no acesso" description="Veja como tentar entrar novamente." onPress={onFailure} />
          <ActionRow icon="user" title="Vínculo não elegível" description="Confira a orientação para este caso." onPress={onIneligible} />
        </View>}
      </View>
      <Text style={s.footer}>Sua participação é voluntária.{ '\n' }Você escolhe o ritmo da sua jornada.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, body: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 22 }, heading: { gap: 12 }, eyebrow: { fontFamily: 'Montserrat_600SemiBold', color: colors.lime, fontSize: 9, letterSpacing: 1.6 }, title: { fontFamily: 'Montserrat_700Bold', color: colors.text, fontSize: 31, lineHeight: 39, letterSpacing: -0.7 }, description: { fontFamily: 'Montserrat_400Regular', color: '#AFC9D7', fontSize: 13, lineHeight: 21 },
  hero: { minHeight: 180, borderWidth: 1, borderColor: '#19516B', borderRadius: 24, backgroundColor: '#04334D', overflow: 'hidden' }, art: { position: 'absolute', width: 165, height: 248, right: -12, top: -8, opacity: 0.85 }, heroCopy: { width: '66%', padding: 20, gap: 10 }, heroIcon: { height: 34, justifyContent: 'center' }, heroTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 17, color: colors.text, lineHeight: 25 }, heroDescription: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#AFC9D7', lineHeight: 18 },
  accessCard: { gap: 18, backgroundColor: colors.surface, borderRadius: 24, padding: 20 }, accessHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, accessIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A4663' }, accessText: { flex: 1, gap: 5 }, accessTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: colors.text }, accessDescription: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 11, lineHeight: 18 }, demoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, demoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 5 }, demoText: { flex: 1, color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 17 }, error: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#FFD3A3', lineHeight: 19 }, offline: { gap: 12 }, offlineText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#FFD3A3', lineHeight: 20 },
  scenarioToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 6 }, scenarioTitle: { flex: 1, color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 12 }, scenarios: { paddingHorizontal: 16, paddingBottom: 4, paddingTop: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border }, scenarioCaption: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 11, lineHeight: 18 }, footer: { marginTop: 'auto', paddingTop: 2, color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 18, textAlign: 'center' },
});
