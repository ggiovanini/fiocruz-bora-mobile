import { Canvas } from '@react-three/fiber';
import { AvatarRenderControl } from './AvatarRenderControl';
import { AvatarScene, type ViewportProps } from './AvatarScene';
export default function AvatarViewport(props: ViewportProps) {
  return <Canvas frameloop={props.rendering === false ? 'never' : props.playing ? 'always' : 'demand'} camera={{ position: [0, .5, 7.8], fov: 40, zoom: props.zoom ?? 1 }} dpr={[1, 2]} fallback={<div>O navegador precisa oferecer suporte a WebGL para exibir o avatar.</div>}><AvatarScene {...props} /><AvatarRenderControl rendering={props.rendering !== false} /></Canvas>;
}
