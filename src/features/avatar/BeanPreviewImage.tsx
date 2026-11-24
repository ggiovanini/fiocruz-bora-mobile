import { Image, StyleSheet, View } from 'react-native';

/** Render of the same Idle pose for devices without a working GL surface. */
export function BeanPreviewImage() {
  return <View pointerEvents="none" style={styles.stage}>
    <Image accessible={false} resizeMode="contain"
      source={require('../../../assets/models/bean/idle-preview.png')}
      style={styles.bean} />
  </View>;
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  bean: { width: '56%', height: '44%' },
});
