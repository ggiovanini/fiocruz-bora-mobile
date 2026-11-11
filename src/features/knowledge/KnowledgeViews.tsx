import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Copy } from '@/ui/Flow';

export type ArticleSummary = { id: string; title: string; category: string; summary: string; cover_url?: string | null };
export type Article = ArticleSummary & { author: string; content?: string; image_url: string | null };
function ArticleImage({ uri, label, compact = false }: { uri?: string | null; label: string; compact?: boolean }) {
  const [failedUrl,setFailedUrl] = useState<string | null>(null);
  if (!uri || failedUrl === uri) return compact ? <View style={s.placeholder}><Icon name="book" size={28}/></View> : <Copy muted>Imagem indisponível.</Copy>;
  return <Image source={{uri}} accessibilityLabel={label} resizeMode="cover" style={compact ? s.thumbnail : s.image} onError={()=>setFailedUrl(uri)}/>;
}
export function ArticleCard({ article, onPress }: { article: ArticleSummary; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${article.title}. ${article.category}. Abrir conteúdo.`} onPress={onPress} style={({pressed})=>[s.card,pressed&&{opacity:.75}]}>
    <ArticleImage uri={article.cover_url} label={`Capa: ${article.title}`} compact/>
    <View style={s.main}><Text style={s.category} numberOfLines={1}>{article.category}</Text><Text style={s.title} numberOfLines={2}>{article.title}</Text><Text style={s.summary} numberOfLines={2}>{article.summary}</Text></View>
    <Icon name="arrow" size={18}/>
  </Pressable>;
}
export function ArticleContent({ article }: { article: Article }) {
  return <>
    <Copy muted>{article.category} · {article.author}</Copy>
    {!!article.image_url && <ArticleImage uri={article.image_url} label={`Imagem: ${article.title}`}/>}
    <Copy>{article.summary}</Copy>
    {!!article.content && <Copy>{article.content}</Copy>}
  </>;
}
const s=StyleSheet.create({
  card:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  main:{flex:1,minWidth:0,gap:5},
  category:{color:colors.primary,fontFamily:'Montserrat_500Medium',fontSize:10,lineHeight:15},
  title:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:15,lineHeight:21},
  summary:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:11,lineHeight:17},
  thumbnail:{width:68,height:84,borderRadius:12},
  placeholder:{width:68,height:84,borderRadius:12,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'},
  image:{width:'100%',aspectRatio:16/9,borderRadius:12},
});
