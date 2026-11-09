import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
export function ActivityStepScreen({ title, step, onBack, onClose, footer, children }: PropsWithChildren<{ title: string; step: number; onBack: () => void; onClose: () => void; footer?: ReactNode }>) {
  return <SafeAreaView style={s.safe}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={s.hit}><Icon name="back"/></Pressable><Text style={s.count}>ADICIONAR ATIVIDADE · {step}/5</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar registro" onPress={onClose} style={[s.hit,{transform:[{rotate:'45deg'}]}]}><Icon name="plus"/></Pressable></View>
    <View style={s.track} accessibilityLabel={`Etapa ${step} de 5`}>{[1,2,3,4,5].map(n=><View key={n} style={[s.segment,n<=step&&{backgroundColor:colors.primary}]}/>)}</View>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={s.body}><Text accessibilityRole="header" style={s.title}>{title}</Text>{children}</ScrollView>
    {footer && <View style={s.footer}>{footer}</View>}
  </SafeAreaView>;
}
export const activityStepStyles = StyleSheet.create({
  choice:{minHeight:70,padding:18,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',gap:14},
  label:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:17,flex:1},
  hint:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:13,lineHeight:20},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:12},
  option:{minWidth:'45%',flexGrow:1,minHeight:72,justifyContent:'center',alignItems:'center',backgroundColor:colors.surface,borderRadius:18,borderWidth:1,borderColor:colors.border},
  value:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:21},
  link:{minHeight:44,alignItems:'center',justifyContent:'center'},
});
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background,width:'100%',maxWidth:560,alignSelf:'center'},header:{paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',height:60},hit:{width:44,height:44,alignItems:'center',justifyContent:'center'},count:{color:colors.muted,fontFamily:'Montserrat_600SemiBold',fontSize:10},track:{flexDirection:'row',gap:5,paddingHorizontal:24},segment:{flex:1,height:3,borderRadius:2,backgroundColor:colors.border},body:{flexGrow:1,padding:24,gap:14,paddingBottom:16},title:{color:colors.text,fontFamily:'Montserrat_700Bold',fontSize:30,lineHeight:38,marginBottom:10},footer:{padding:24,paddingTop:12,gap:10}});
