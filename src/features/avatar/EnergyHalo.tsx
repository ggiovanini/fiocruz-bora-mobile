import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { progressArcs } from './progressArc';

function arcPath(start: number, sweep: number, radius: number) {
  const end = start + sweep;
  return `M ${radius * Math.cos(start)} ${-radius * Math.sin(start)} A ${radius} ${radius} 0 ${Math.abs(sweep) > Math.PI ? 1 : 0} 1 ${radius * Math.cos(end)} ${-radius * Math.sin(end)}`;
}

function EnergyArc({ start, sweep, radius, color, width, opacity }: {
  start: number; sweep: number; radius: number; color: string; width: number; opacity: number;
}) {
  if (Math.abs(sweep) < .00001) return null;
  const props = { transform: 'translate(0 -.25)', fill: 'none', stroke: color,
    strokeWidth: width, strokeOpacity: opacity, strokeLinecap: 'round' as const };
  // A single SVG arc cannot draw a full circle with coincident endpoints.
  return Math.abs(sweep) >= Math.PI * 2 - .00001
    ? <Circle cx={0} cy={0} r={radius} {...props} />
    : <Path d={arcPath(start, sweep, radius)} {...props} />;
}

export function EnergyHalo({ physical, mental }: { physical: number; mental: number }) {
  const arcs = progressArcs(physical, mental);
  return <Svg pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}
    width="100%" height="100%" viewBox="-2.7 -2.7 5.4 5.4">
    {/* Soft layers feather the full circular track without a device-specific blur filter. */}
    {Array.from({ length: 10 }, (_, index) => <Circle key={index} cx={0} cy={0} r={1.72}
      transform="translate(0 -.25)" fill="none" stroke="#001925" strokeWidth={1.06 - index * .04}
      strokeOpacity={.075} strokeLinecap="round" />)}
    <EnergyArc {...arcs.goal} radius={2.05} color="white" width={.025} opacity={.88} />
    <EnergyArc {...arcs.physical} radius={1.8} color="#79ff00" width={.37} opacity={.84} />
    <EnergyArc {...arcs.mental} radius={1.53} color="#0a9ff5" width={.39} opacity={.84} />
  </Svg>;
}
