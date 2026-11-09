import { Image } from 'react-native';
/** Approved campaign mascot. Decorative; journey values are shown separately. */
export function BeanImage({ size = 160 }: { size?: number }) {
 return <Image source={require('../../../assets/images/bean/bean-wave-v1.png')} resizeMode="contain" style={{ width: size, height: size, alignSelf: 'center' }} accessible={false}/>;
}
