import { Image, StyleSheet, View } from 'react-native';
import { FiocruzLogo } from './FiocruzLogo';
import { colors } from '@/design/tokens';

/** Combined Bora and Fiocruz signature, adapted for the app's dark background. */
export function Brand() {
  return <View style={s.brand} accessible accessibilityRole="image" accessibilityLabel="Bóra — Fiocruz">
    <Image source={require('../../assets/imgs/Logo.png')} style={s.symbol} accessible={false} />
    <View style={s.signature}>
      <Image source={require('../../assets/imgs/Tipo.png')} style={s.wordmark} accessible={false} />
      <FiocruzLogo width={64} decorative />
    </View>
  </View>;
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  symbol: { width: 40, height: 46, resizeMode: 'contain' },
  signature: { alignItems: 'flex-end', gap: 1 },
  wordmark: { width: 87, height: 35, resizeMode: 'contain', tintColor: colors.text },
});
