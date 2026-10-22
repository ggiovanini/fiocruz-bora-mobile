import Svg, { Circle, Path, Rect } from 'react-native-svg';
export type IconName = 'home' | 'target' | 'trophy' | 'user' | 'plus' | 'arrow' | 'back' | 'menu' | 'bolt' | 'book' | 'activity' | 'phone' | 'qr' | 'edit' | 'clock' | 'search' | 'check' | 'pause' | 'play' | 'leaf' | 'bell';
const paths: Partial<Record<IconName, string>> = {
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21a2 2 0 0 0 4 0',
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  target: 'M12 8a4 4 0 1 0 4 4M12 3a9 9 0 1 0 9 9M12 12l8-8m-4 0h4v4',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-4 1h8',
  user: 'M4 21v-2a8 8 0 0 1 16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-6-6 6 6-6 6', back: 'm15 5-7 7 7 7', menu: 'M4 6h16M4 12h12M4 18h16',
  bolt: 'm13 2-9 12h7l-1 8 10-12h-8l1-8Z', book: 'M12 6v15M3 3c4-1 7 1 9 3 2-2 5-4 9-3v15c-4-1-7 1-9 3-2-2-5-4-9-3V3Z',
  activity: 'M2 12h5l3-9 4 18 3-9h5', phone: 'M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M9 3h6M10 17h4',
  edit: 'm15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z', clock: 'M12 7v5l3 2', search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', check: 'm5 12 4 4L19 6', pause: 'M8 5v14M16 5v14', play: 'm8 4 12 8-12 8V4Z', leaf: 'M20 3C7 1 1 11 7 17s16 0 13-14ZM4 21 16 9',
};
export function Icon({ name, color = '#0A9FF5', size = 24 }: { name: IconName; color?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {paths[name] && <Path d={paths[name]} />}
    {name === 'clock' && <Circle cx={12} cy={12} r={9} />}
    {name === 'qr' && <><Rect x={3} y={3} width={6} height={6} rx={1} /><Rect x={15} y={3} width={6} height={6} rx={1} /><Rect x={3} y={15} width={6} height={6} rx={1} /><Path d="M15 15h3v3h3v3h-6v-3m6-3v-3" /></>}
  </Svg>;
}
