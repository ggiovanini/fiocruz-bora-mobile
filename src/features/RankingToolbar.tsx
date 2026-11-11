import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/design/Icon';
import { colors } from '@/design/tokens';

function Action({icon,label,accessibilityLabel,onPress,disabled=false}:{icon:IconName;label:string;accessibilityLabel?:string;onPress:()=>void;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.action,(disabled || pressed)&&s.dim]}><Icon name={icon} size={21}/><Text style={s.label}>{label}</Text></Pressable>;
}
export function RankingToolbar({onTeams,onAbout,onRefresh,busy=false}:{onTeams?:()=>void;onAbout:()=>void;onRefresh?:()=>void;busy?:boolean}) {
  return <View style={s.toolbar}>
    {onTeams && <Action icon="users" label="Equipes" accessibilityLabel="Conhecer e participar de equipes" onPress={onTeams}/>}
    <View style={s.tools}><Action icon="book" label="Como funciona" onPress={onAbout}/>{onRefresh && <Action icon="clock" label="Atualizar" disabled={busy} onPress={onRefresh}/>}</View>
  </View>;
}
const s=StyleSheet.create({toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8},tools:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:12},action:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:3},label:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:11},dim:{opacity:.5}});
