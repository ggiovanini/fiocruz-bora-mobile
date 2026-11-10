import { Animated, Image, StyleSheet, View } from 'react-native';
import { FiocruzLogo } from './FiocruzLogo';
import { colors } from '@/design/tokens';

/** Combined Bora and Fiocruz signature, adapted for the app's dark background. */
export function Brand({ compact = false, signatureOpacity = 1 }: { compact?: boolean; signatureOpacity?: number | Animated.AnimatedInterpolation<number> }) {
  return <View style={s.brand} accessible accessibilityRole="image" accessibilityLabel="Bóra — Fiocruz">
    <Image source={require('../../assets/imgs/Logo.png')} style={[s.symbol, compact && s.compactSymbol]} accessible={false} />
    <Animated.View style={[s.signature, compact && s.compactSignature, { opacity: signatureOpacity }]}>
      <Image source={require('../../assets/imgs/Tipo.png')} style={[s.wordmark, compact && s.compactWordmark]} accessible={false} />
      <FiocruzLogo width={compact ? 48 : 64} decorative />
    </Animated.View>
  </View>;
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  symbol: { width: 40, height: 46, resizeMode: 'contain' },
  compactSymbol: { width: 28, height: 34 },
  compactSignature: { gap: 0 },
  compactWordmark: { width: 65, height: 26 },
  signature: { alignItems: 'flex-end', gap: 1 },
  wordmark: { width: 87, height: 35, resizeMode: 'contain', tintColor: colors.text },
});
