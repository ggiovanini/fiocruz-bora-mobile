import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { apiRequest } from '@/api/session';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { ArticleCard, ArticleContent, type Article } from './knowledge/KnowledgeViews';

export function LiveKnowledge({ tab = false }: { tab?: boolean }) {
  const [search,setSearch] = useState('');
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState<Article | null>(null);
  const { items, busy, error, more, refresh, loadMore } = usePagedResource<Article>(`/knowledge${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  return <ListScreen title="Conhecer" icon="book" back={!tab} search={{value:search,onChangeText:setSearch,onSubmit:()=>setQuery(search.trim()),activeQuery:query,onClear:()=>{setSearch('');setQuery('');},placeholder:'Título, resumo ou categoria'}}>
    {busy && <Copy muted>Carregando conteúdos…</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/></>}
    {!busy && !error && !items.length && <Card title={query ? 'Nenhum conteúdo encontrado' : 'Novos conteúdos vêm aí'}><Copy>{query ? 'Tente outro termo ou limpe a busca.' : 'Nenhum conteúdo publicado no momento. Volte em breve.'}</Copy></Card>}
    {items.map(article=><ArticleCard key={article.id} article={article} onPress={()=>setSelected(article)}/>)}
    {more && <Button secondary title="Carregar mais conteúdos" disabled={busy} onPress={loadMore}/>}
    {selected && <LiveArticleModal key={selected.id} selected={selected} onClose={()=>setSelected(null)}/>}
  </ListScreen>;
}
function useArticle(id?: string) {
  const [article,setArticle] = useState<Article | null>(null);
  const [busy,setBusy] = useState(true);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  useFocusEffect(useCallback(()=>{
    let active=true;
    setArticle(null);setBusy(true);setError('');
    if (!id || Array.isArray(id)) { setBusy(false);setError('Conteúdo não encontrado.');return; }
    apiRequest(`/knowledge/${encodeURIComponent(id)}`).then(result=>{if(active)setArticle(result.data);})
      .catch(failure=>{if(active)setError(failure?.status===404 ? 'Este conteúdo não está mais disponível.' : failure instanceof Error ? failure.message : 'Não foi possível abrir o conteúdo.');})
      .finally(()=>{if(active)setBusy(false);});
    return ()=>{active=false;};
  },[id,retry]));
  return {article,busy,error,retry:()=>setRetry(value=>value+1)};
}
function ArticleRequestContent({ article,busy,error,retry }: ReturnType<typeof useArticle>) {
  return <>
    {busy && <Copy muted>Carregando conteúdo…</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" onPress={retry}/></>}
    {article && <ArticleContent article={article}/>}
  </>;
}
function LiveArticleModal({selected,onClose}:{selected:Article;onClose:()=>void}) {
  const resource=useArticle(selected.id);
  return <Sheet visible title={resource.article?.title ?? selected.title} onClose={onClose}><ArticleRequestContent {...resource}/></Sheet>;
}
// Preserve existing direct links while the list opens the same content in a modal.
export function LiveArticle() {
  const {id}=useLocalSearchParams<{id:string}>();
  const resource=useArticle(id);
  return <Flow title={resource.article?.title ?? 'Conhecer'}><ArticleRequestContent {...resource}/></Flow>;
}
