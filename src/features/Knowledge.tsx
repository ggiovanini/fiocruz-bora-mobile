import { useCallback, useState } from 'react';
import { Image } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '@/api/session';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';

type Article = { id: string; title: string; category: string; summary: string; author: string; content?: string; cover_url: string; image_url: string | null };
function ArticleImage({ uri, label }: { uri: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Copy muted>Imagem indisponível.</Copy>;
  return <Image source={{ uri }} accessibilityLabel={label} resizeMode="cover" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} onError={() => setFailed(true)}/>;
}
export function LiveKnowledge({ tab = false }: { tab?: boolean }) {
  const router = useRouter();
  const { items, busy, error, more, refresh, loadMore } = usePagedResource<Article>('/knowledge');
  return <Flow title="Conhecer" back={!tab}>
    <Copy muted>Ideias e conteúdos para movimentar o corpo, aprender e cuidar de você.</Copy>
    {busy && <Copy muted>Carregando conteúdos…</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/></>}
    {!busy && !error && !items.length && <Card title="Novos conteúdos vêm aí"><Copy>Nenhum conteúdo publicado no momento. Volte em breve.</Copy></Card>}
    {items.map(article => <Card key={article.id} title={article.title}>
      <ArticleImage key={article.cover_url} uri={article.cover_url} label={`Capa: ${article.title}`}/>
      <Copy muted>{article.category} · {article.author}</Copy><Copy>{article.summary}</Copy>
      <Button secondary title="Abrir conteúdo" onPress={() => router.push({ pathname: '/article', params: { id: article.id } })}/>
    </Card>)}
    {more && <Button secondary title="Carregar mais conteúdos" disabled={busy} onPress={loadMore}/>}
  </Flow>;
}
export function LiveArticle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setArticle(null); setBusy(true); setError('');
    if (!id || Array.isArray(id)) { setBusy(false); setError('Conteúdo não encontrado.'); return; }
    apiRequest(`/knowledge/${encodeURIComponent(id)}`).then(result => { if (active) setArticle(result.data); })
      .catch(failure => { if (active) setError(failure?.status === 404 ? 'Este conteúdo não está mais disponível.' : failure instanceof Error ? failure.message : 'Não foi possível abrir o conteúdo.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [id, retry]));
  return <Flow title={article?.title ?? 'Conhecer'}>
    {busy && <Copy muted>Carregando conteúdo…</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" onPress={() => setRetry(value => value + 1)}/></>}
    {article && <>
      <Copy muted>{article.category} · {article.author}</Copy>
      {!!article.image_url && <ArticleImage key={article.image_url} uri={article.image_url} label={`Imagem: ${article.title}`}/>}
      <Copy>{article.summary}</Copy><Copy>{article.content}</Copy>
    </>}
  </Flow>;
}
