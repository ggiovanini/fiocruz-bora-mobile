import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Icon, type IconName } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Sheet } from '@/ui/Sheet';

type Period = 'current' | 'previous';
const periods = [{ id: 'current', label: 'Atual' }, { id: 'previous', label: 'Anterior' }] as const;

function Action({icon,label,accessibilityLabel,onPress,disabled=false}:{icon:IconName;label:string;accessibilityLabel?:string;onPress:()=>void;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.action,(disabled || pressed)&&s.dim]}><Icon name={icon} size={21}/><Text style={s.label}>{label}</Text></Pressable>;
}
export function RankingToolbar({period,onPeriodChange,onAbout,onRefresh,busy=false}:{period:Period;onPeriodChange:(period:Period)=>void;onAbout:()=>void;onRefresh?:()=>void;busy?:boolean}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodLabel = periods.find(item => item.id === period)!.label;
  return <>
    <View>
      <View style={s.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Período do ranking: ${periodLabel}. Selecionar período`} accessibilityState={{expanded:periodOpen}} onPress={() => setPeriodOpen(true)} style={({pressed}) => [s.action, pressed && s.dim]}>
          <Text style={s.label}>{periodLabel}</Text><ChevronDown size={16} color={colors.primary}/>
        </Pressable>
        <View style={s.tools}>
        <Action icon="book" label="Como funciona" onPress={onAbout}/>
        {onRefresh && <Action icon="clock" label="Atualizar" disabled={busy} onPress={onRefresh}/>}
        </View>
      </View>
    </View>
    <Sheet visible={periodOpen} title="Período do ranking" onClose={() => setPeriodOpen(false)}>
      {periods.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{checked:period === item.id}} onPress={() => { setPeriodOpen(false); if (period !== item.id) onPeriodChange(item.id); }} style={({pressed}) => [s.option, pressed && s.dim]}>
        <Text style={[s.optionLabel, period === item.id && s.selected]}>{item.label}</Text>
        {period === item.id && <Icon name="check" size={20}/>}
      </Pressable>)}
    </Sheet>
  </>;
}
const s=StyleSheet.create({toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',columnGap:8},tools:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',flexWrap:'wrap',columnGap:8,marginLeft:'auto',flexShrink:1},action:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:3},label:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:11},dim:{opacity:.5},option:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,borderRadius:12,backgroundColor:colors.surface},optionLabel:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:14},selected:{color:colors.primary,fontFamily:'Montserrat_700Bold'}});
