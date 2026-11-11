import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Activity } from '@/mocks/model';
import { apiEnabled } from '@/api/session';
import { Button } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { registrationMessage } from './registrationMessage';
import type { EnergyKind } from './catalog';
export function ActivityCelebration({ activity, dimension, onClose }: { activity: Activity; dimension: EnergyKind; onClose: () => void }) {
  const message = registrationMessage(activity, apiEnabled);
  return <View style={s.screen}>
    <Image source={dimension === 'physical' ? require('../../../assets/images/bean/celebrate-physical-v1.png') : require('../../../assets/images/bean/celebrate-mental-v1.png')} style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]} resizeMode="cover" accessible={false}/>
    <SafeAreaView style={s.safe}>
      <Text accessibilityRole="header" style={s.title}>Arrasou!</Text>
      <View style={s.footer}><Text accessibilityLiveRegion="polite" style={s.message}>{message}</Text><Button title="Arrasei!" onPress={onClose}/></View>
    </SafeAreaView>
  </View>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},safe:{flex:1,width:'100%',maxWidth:560,alignSelf:'center',justifyContent:'space-between',padding:24},title:{color:colors.text,fontFamily:'Montserrat_700Bold',fontSize:38,textAlign:'center',marginTop:24},footer:{gap:16,paddingBottom:16},message:{textAlign:'center',color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:14,lineHeight:21}});
