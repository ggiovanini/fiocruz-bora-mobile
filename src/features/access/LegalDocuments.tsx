import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { Flow, Button, Copy, Notice } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { fetchLegalDocuments, type LegalDocument, type LegalDocumentSummary } from '@/api/legalDocuments';

export default function LegalDocuments() {
  const { slug, version } = useLocalSearchParams<{ slug?: string; version?: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [documents, setDocuments] = useState<LegalDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    setDocument(null);
    setDocuments([]);
    fetchLegalDocuments(slug, version).then(result => {
      if (!current) return;
      if (Array.isArray(result)) setDocuments(result);
      else setDocument(result);
    }).catch(error => {
      if (current) setError(error instanceof Error && error.name !== 'AbortError'
        ? error.message : 'Verifique sua conexão e tente novamente.');
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [slug, version, attempt]);
  return <Flow title={document?.title ?? 'Documentos legais'} tag="TRANSPARÊNCIA E CUIDADO" demo={false}>
    {loading && <ActivityIndicator color={colors.lime} accessibilityLabel="Carregando documento" />}
    {!!error && <><Notice>{error}</Notice><Button title="Tentar novamente" onPress={() => setAttempt(value => value + 1)} /></>}
    {document && <>
      <Copy>{document.description}</Copy>
      <Copy muted>Versão {document.version} · Publicado em {new Date(document.published_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</Copy>
      <View style={styles.content}><Text selectable style={styles.text}>{document.content}</Text></View>
      <Button secondary title="Abrir no navegador" onPress={() => {
        void Linking.openURL(version ? document.version_url : document.url).catch(() => setError('Não foi possível abrir o navegador.'));
      }} />
    </>}
    {!loading && !error && !slug && documents.length === 0 && <Notice>Nenhum documento publicado no momento.</Notice>}
    {documents.map(item => <View key={item.id} style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>{item.title}</Text>
      <Copy muted>{item.description}</Copy>
      <Button secondary title="Ler documento" onPress={() => router.push({ pathname: '/legal', params: { slug: item.slug } })} />
    </View>)}
    <Text style={styles.footer}>Bóra · Movimento e mente no seu ritmo.</Text>
  </Flow>;
}
const styles = StyleSheet.create({
  content: { padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 25, color: colors.text },
  card: { gap: 14, padding: 20, borderRadius: 20, backgroundColor: colors.surface },
  heading: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 17 },
  footer: { textAlign: 'center', color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10, paddingVertical: 20 },
});
