import { Canvas } from '@react-three/fiber/native';
import { AvatarRenderControl } from './AvatarRenderControl';
import { AvatarScene, type ViewportProps } from './AvatarScene';
export default function AvatarViewport(props: ViewportProps) {
  return <Canvas onCreated={() => { if (__DEV__) console.debug("[Bora3D] Contexto gráfico criado"); }} frameloop={props.rendering === false ? 'never' : props.playing ? 'always' : 'demand'} camera={{ position: [0, .5, 7.8], fov: 40 }}><AvatarScene {...props} /><AvatarRenderControl rendering={props.rendering !== false} /></Canvas>;
}
