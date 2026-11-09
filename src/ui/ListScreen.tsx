import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Icon, type IconName } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { Button, Notice } from './Flow';

export type ListSearch = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  activeQuery?: string;
  onClear?: () => void;
  placeholder?: string;
  maxLength?: number;
};
/** A list title that compacts first, then leaves with the content. Search is opt-in. */
export function ListScreen({ title, icon, search, back = true, children }: PropsWithChildren<{ title: string; icon?: IconName; search?: ListSearch; back?: boolean }>) {
  const { state, storageError, api } = useMock();
  const [searchOpen, setSearchOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const [collapse, setCollapse] = useState(0);
  const ratio = collapse / 64;
  useEffect(() => {
    if (!searchOpen) return;
    const frame = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);
  function toggleSearch() {
    if (searchOpen) { Keyboard.dismiss(); setSearchOpen(false); return; }
    scroll.current?.scrollTo({y:0,animated:false});
    setCollapse(0);
    setSearchOpen(true);
  }
  function submitSearch() {
    search?.onSubmit();
    Keyboard.dismiss();
    setSearchOpen(false);
  }
  function clearSearch() {
    search?.onClear?.();
    Keyboard.dismiss();
    setSearchOpen(false);
  }
  return <SafeAreaView edges={['top','left','right']} style={s.safe}>
    <AppHeader back={back}/>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets scrollEventThrottle={16}
      onScroll={event => setCollapse(Math.max(0,Math.min(64,event.nativeEvent.contentOffset.y)))} contentContainerStyle={s.body}>
      <View collapsable={false} style={[s.heading,{paddingVertical:18-12*ratio,transform:[{translateY:collapse}]}]}>
        <View style={s.titleRow}>
          {icon && <Icon name={icon} size={26}/>}
          <Text accessibilityRole="header" style={[s.title,s.titleBox,{fontSize:27-6*ratio,lineHeight:35-6*ratio}]}>{title}</Text>
          {search && <Pressable accessibilityRole="button" accessibilityLabel={`${searchOpen ? 'Recolher' : 'Abrir'} busca em ${title}`} accessibilityState={{expanded:searchOpen}} onPress={toggleSearch} style={[s.hit,searchOpen&&s.selected]}><Icon name="search" size={24}/>{!!search.activeQuery && <View style={s.dot}/>}</Pressable>}
        </View>
        {search && searchOpen && <View style={s.searchPanel}>
          <View style={s.searchRow}><TextInput ref={input} accessibilityLabel={`Buscar em ${title}`} value={search.value} onChangeText={search.onChangeText} placeholder={search.placeholder ?? `Buscar em ${title}`} placeholderTextColor={colors.muted} maxLength={search.maxLength ?? 100} returnKeyType="search" autoCorrect={false} onSubmitEditing={submitSearch} style={s.input}/><Pressable accessibilityRole="button" accessibilityLabel="Aplicar busca" onPress={submitSearch} style={s.hit}><Icon name="arrow" size={24}/></Pressable></View>
          {!!search.activeQuery && search.onClear && <Pressable accessibilityRole="button" onPress={clearSearch} style={s.clear}><Text style={s.clearText}>Limpar busca</Text></Pressable>}
        </View>}
        {search?.activeQuery && !searchOpen && <View style={s.filter}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Editar busca: ${search.activeQuery}`} onPress={toggleSearch} style={s.filterTerm}><Icon name="search" size={14}/><Text numberOfLines={1} style={s.filterText}>{search.activeQuery}</Text></Pressable>
          {search.onClear && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={clearSearch} style={s.hit}><View style={{transform:[{rotate:'45deg'}]}}><Icon name="plus" size={18}/></View></Pressable>}
        </View>}
      </View>
      {state.offline && <Notice>Sem conexão. Seus registros ficam pendentes.</Notice>}
      {!!storageError && <Notice>Não foi possível salvar neste aparelho. Tente novamente.</Notice>}
      {apiEnabled && state.session === 'active' && !!api.error && <><Notice>{api.error}</Notice><Button title="Tentar novamente" disabled={api.busy} onPress={()=>{void api.refresh().catch(()=>{});}}/></>}
      {children}
    </ScrollView>
  </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},body:{width:'100%',maxWidth:520,alignSelf:'center',paddingHorizontal:24,paddingBottom:40,gap:16},heading:{paddingVertical:12,zIndex:2,backgroundColor:colors.background,marginHorizontal:-24,paddingHorizontal:24},titleRow:{flexDirection:'row',alignItems:'center',gap:12},titleBox:{flex:1,minWidth:0},title:{fontSize:27,lineHeight:35,color:colors.text,fontFamily:'Montserrat_700Bold'},hit:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:14},selected:{backgroundColor:colors.surface},dot:{position:'absolute',top:7,right:6,width:5,height:5,borderRadius:3,backgroundColor:colors.lime},searchPanel:{marginTop:22,padding:12,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},searchRow:{flexDirection:'row',alignItems:'center',gap:8},input:{flex:1,minWidth:0,minHeight:54,paddingHorizontal:4,color:colors.text,fontSize:16,fontFamily:'Montserrat_400Regular'},clear:{minHeight:44,justifyContent:'center',alignItems:'flex-start'},clearText:{color:colors.primary,fontSize:12,fontFamily:'Montserrat_500Medium'},filter:{marginTop:12,flexDirection:'row',alignItems:'center',borderRadius:14,backgroundColor:colors.surface,paddingLeft:12},filterTerm:{flex:1,minHeight:44,flexDirection:'row',alignItems:'center',gap:8},filterText:{flex:1,color:colors.text,fontSize:12,fontFamily:'Montserrat_500Medium'}});
