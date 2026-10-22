import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { FiocruzLogo } from '@/components/FiocruzLogo';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Button, Copy, Flow, Notice } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { fetchLegalDocuments, type LegalDocument } from '@/api/legalDocuments';
import { ABOUT_SLUG, DEFAULT_ABOUT_CONTENT } from './aboutContent';

export default function About() {
  const router = useRouter();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const version = Constants.expoConfig?.version ?? 'Não informada';
  const build = Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber
    : Platform.OS === 'android' ? Constants.expoConfig?.android?.versionCode : undefined;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchLegalDocuments(ABOUT_SLUG).then(result => {
      if (active && !Array.isArray(result)) setDocument(result);
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <Flow title="Sobre o Bóra" tag="UM PRODUTO FIOCRUZ" demo={false}>
    <View style={s.institution}>
      <FiocruzLogo width={220} />
      <Copy muted>Fundação Oswaldo Cruz</Copy>
    </View>
    <Copy muted>Versão {version}{build ? ` · Build ${build}` : ''}</Copy>
    {loading && <ActivityIndicator color={colors.lime} accessibilityLabel="Atualizando informações sobre o Bóra" />}
    <View style={s.content}><Text selectable style={s.text}>{document?.content ?? DEFAULT_ABOUT_CONTENT}</Text></View>
    {error && <>
      <Notice>{document ? 'Não foi possível atualizar o texto. Exibindo a última versão carregada.' : 'Exibindo a apresentação incluída no aplicativo. Não foi possível consultar a publicação atual.'}</Notice>
      <Button secondary title="Tentar atualizar" onPress={() => setAttempt(value => value + 1)} />
    </>}
    <Button secondary title="Termos de Uso" onPress={() => router.push({ pathname: '/legal', params: { slug: 'termos-de-uso' } })} />
    <Button secondary title="Política de Privacidade" onPress={() => router.push({ pathname: '/legal', params: { slug: 'politica-de-privacidade' } })} />
    <Text style={s.copyright}>© {new Date().getFullYear()} Fundação Oswaldo Cruz (Fiocruz).{ '\n' }Todos os direitos reservados.</Text>
  </Flow>;
}
const s = StyleSheet.create({
  institution: { alignItems: 'center', gap: 14, paddingVertical: 18 },
  content: { padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 25, color: colors.text },
  copyright: { textAlign: 'center', fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 19, color: colors.muted, paddingVertical: 20 },
});
