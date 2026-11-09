import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';

/** Simple campaign objects, independent of the participant's energy balance. */
export function ActivityIllustrations({ size = 160 }: { size?: number }) {
  return <View style={s.row}>
    <View style={s.item}>
      <Image source={require('../../../assets/images/bean/activity-weight-v1.png')} style={{ width: '100%', height: size }} resizeMode="contain" accessible={false}/>
      <Text style={s.label}>Atividade física</Text>
    </View>
    <View style={s.item}>
      <Image source={require('../../../assets/images/bean/activity-book-v1.png')} style={{ width: '100%', height: size }} resizeMode="contain" accessible={false}/>
      <Text style={s.label}>Atividade mental</Text>
    </View>
  </View>;
}
const s = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', maxWidth: 420, alignSelf: 'center', gap: 12 }, item: { flex: 1, alignItems: 'center', gap: 10 }, label: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 12, textAlign: 'center' } });
