import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon, type IconName } from '@/design/Icon';
const designs: Record<string, { color: string; icon: IconName }> = {
  movement: { color: '#79FF00', icon: 'leaf' }, knowledge: { color: '#0A9FF5', icon: 'book' },
  constancy: { color: '#FFCB05', icon: 'bolt' }, achievement: { color: '#FFCB05', icon: 'trophy' },
};
export function MedalBadge({ variant, name, earned = true, imageUrl }: { variant: string; name: string; earned?: boolean; imageUrl?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const design = designs[variant] ?? designs.achievement;
  return <View style={[s.badge, !earned && s.locked]} accessible accessibilityLabel={`${name}${earned ? ', medalha conquistada' : ', medalha de conclusão'}`}>
    {imageUrl && failedUrl !== imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: 104, height: 132 }} resizeMode="contain" onError={() => setFailedUrl(imageUrl)} /> : <>
    <Svg width={104} height={132} viewBox="0 0 112 144">
      <Path d="M28 77 20 137 43 125 56 139 58 81Z" fill="#0877B4" />
      <Path d="m54 80 1 58 16-13 22 12-10-63Z" fill="#0A9FF5" />
      <Circle cx={56} cy={53} r={47} fill={design.color} opacity={0.18} />
      <Circle cx={56} cy={53} r={41} fill="#073B59" stroke={design.color} strokeWidth={3} />
      <Circle cx={56} cy={53} r={33} fill="none" stroke={design.color} opacity={0.4} strokeDasharray="2 5" />
    </Svg>
    <View style={s.icon}><Icon name={design.icon} color={design.color} size={30} /></View></>}
  </View>;
}
const s = StyleSheet.create({ badge: { width: 104, height: 132, alignSelf: 'center' }, icon: { position: 'absolute', top: 34, left: 37 }, locked: { opacity: 0.65 } });
