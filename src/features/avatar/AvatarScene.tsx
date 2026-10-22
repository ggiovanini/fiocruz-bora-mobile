import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import {progressArcs} from './progressArc';
export type Motion = 'idle' | 'walk' | 'celebrate';
export type SceneProps = { motion: Motion; playing: boolean; speed: number; greenProgress: number; blueProgress: number };
export type ViewportProps = SceneProps & { rendering?: boolean; zoom?: number };

function ProgressArc({start, sweep, color, depth = 0}: {start: number; sweep: number; color: string; depth?: number}) {
  if (sweep <= 0) return null;
  const radius = 2.05, thickness = .075;
  return <group position={[0, 0, depth]}>
    <mesh rotation={[0, 0, start]}><torusGeometry args={[radius, thickness, 12, 128, sweep]} /><meshBasicMaterial color={color} /></mesh>
    {[start, start + sweep].map((angle, index) => <mesh key={index} position={[radius * Math.cos(angle), radius * Math.sin(angle), 0]}><sphereGeometry args={[thickness, 16, 12]} /><meshBasicMaterial color={color} /></mesh>)}
  </group>;
}

function Limb({ x, leg = false, side, motion, time }: { x: number; leg?: boolean; side: number; motion: Motion; time: React.MutableRefObject<number> }) {
  const pivot = useRef<Group>(null);
  useFrame(() => {
    if (!pivot.current) return;
    const t = time.current;
    pivot.current.rotation.x = motion === 'walk' ? Math.sin(t * 5 + side * Math.PI / 2) * (leg ? .65 : .7) : 0;
    pivot.current.rotation.z = leg ? side * .07 : motion === 'celebrate' ? side * (2.2 + Math.sin(t * 7) * .18) : side * (.22 + Math.sin(t * 2) * .06);
  });
  return <group ref={pivot} position={[x, leg ? -.35 : .85, 0]}>
    <mesh position={[0, leg ? -.53 : -.4, 0]} scale={[leg ? .13 : .105, leg ? .56 : .43, .13]}><sphereGeometry args={[1, 16, 16]} /><meshStandardMaterial color="#79ff00" roughness={.55} /></mesh>
    <mesh position={[0, leg ? -1.07 : -.82, leg ? .12 : 0]} scale={[leg ? .16 : .11, .11, leg ? .28 : .14]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#79ff00" /></mesh>
  </group>;
}

export function AvatarScene({ motion, playing, speed, greenProgress, blueProgress }: SceneProps) {
  const arcs = progressArcs(greenProgress, blueProgress);
  const body = useRef<Group>(null);
  const time = useRef(0);
  const base = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (playing) time.current += Math.min(delta, .05) * speed;
    const t = time.current;
    if (body.current) {
      body.current.position.y = motion === 'celebrate' ? Math.abs(Math.sin(t * 4)) * .3 : Math.sin(t * (motion === 'walk' ? 10 : 2)) * .035;
      body.current.rotation.y = motion === 'celebrate' ? Math.sin(t * 2) * .35 : -.15;
    }
    if (base.current) base.current.rotation.z = t * .2;
  });
  return <>
    <ambientLight intensity={1.8} /><directionalLight position={[3, 5, 5]} intensity={2.5} color="#c9faff" />
    <pointLight position={[-3, 1, 2]} intensity={12} color="#0a9ff5" />
    <group position={[0, .25, -.6]}>
      <ProgressArc {...arcs.track} color="#23536b" />
      <ProgressArc {...arcs.physical} color="#79ff00" depth={.02} />
      <ProgressArc {...arcs.mental} color="#0a9ff5" depth={.025} />
    </group>
    <group ref={body}>
      <mesh position={[0, .25, 0]} scale={[.42, .78, .25]}><sphereGeometry args={[1, 24, 24]} /><meshStandardMaterial color="#58e52d" roughness={.45} /></mesh>
      <mesh position={[0, -.27, .02]} rotation={[0, 0, -.2]} scale={[.44, .45, .27]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#65ed1d" /></mesh>
      <mesh position={[0, 1.15, 0]}><cylinderGeometry args={[.1, .13, .3, 12]} /><meshStandardMaterial color="#58e52d" /></mesh>
      <mesh position={[0, 1.65, -.05]} scale={[.4, .64, .28]}><sphereGeometry args={[1, 24, 24]} /><meshStandardMaterial color="#087fbc" roughness={.35} /></mesh>
      <mesh position={[.02, 2.2, -.06]} rotation={[0, 0, .13]}><coneGeometry args={[.29, .85, 24]} /><meshStandardMaterial color="#087fbc" roughness={.35} /></mesh>
      <mesh position={[0, 1.53, .21]} scale={[.29, .36, .14]}><sphereGeometry args={[1, 24, 24]} /><meshStandardMaterial color="#58e52d" roughness={.5} /></mesh>
      <Limb x={-.43} side={-1} motion={motion} time={time} /><Limb x={.43} side={1} motion={motion} time={time} />
      <Limb x={-.21} side={-1} leg motion={motion} time={time} /><Limb x={.21} side={1} leg motion={motion} time={time} />
    </group>
    <mesh ref={base} position={[0, -1.65, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.65, .72, 64]} /><meshBasicMaterial color="#0a9ff5" side={2} /></mesh>
    <mesh position={[0, -1.66, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.5, 48]} /><meshBasicMaterial color="#124d59" side={2} /></mesh>
  </>;
}
