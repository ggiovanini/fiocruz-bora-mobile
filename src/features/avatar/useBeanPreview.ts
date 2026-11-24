import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { AnimationClip, AnimationMixer, Box3, Group, LoopOnce, Material, Mesh, MeshStandardMaterial, SkinnedMesh, Texture, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBeanColors } from './beanColors';

const clipNames = {
  idle: 'A_Bora_Idle',
  wave: 'A_Bora_Waving',
  celebrate: 'A_Bora_Celebrate',
} as const;

type BeanMotion = keyof typeof clipNames;

export const BEAN_PREVIEW_FLOOR = -1.25;

function disposeModel(model: Group) {
  const materials = new Set<Material>();
  model.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    if (node instanceof SkinnedMesh) node.skeleton.dispose();
    for (const material of [node.material].flat()) materials.add(material);
  });
  const textures = new Set<Texture>();
  materials.forEach(material => {
    if (material instanceof MeshStandardMaterial && material.map) textures.add(material.map);
    material.dispose();
  });
  textures.forEach(texture => {
    const image = texture.image;
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
  });
}

export function useBeanPreview(enabled: boolean, motion: BeanMotion, playing: boolean, speed: number, motionRequest: number, baseHex?: string, accentHex?: string) {
  const [bean, setBean] = useState<{
    scene: Group;
    mixer: AnimationMixer;
    clips: AnimationClip[];
    colors: ReturnType<typeof createBeanColors>;
  } | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const invalidate = useThree(state => state.invalidate);

  useEffect(() => {
    if (!bean) return;
    bean.colors.update(baseHex, accentHex);
    invalidate();
  }, [bean, baseHex, accentHex, invalidate]);

  useFrame((_, delta) => {
    if (enabled && playing) bean?.mixer.update(Math.min(delta, .05) * speed);
  });

  useEffect(() => {
    if (!enabled || !bean) return;

    const { mixer, clips } = bean;
    const idle = clips.find(clip => clip.name === clipNames.idle);
    if (!idle) return;
    const clip = clips.find(clip => clip.name === clipNames[motion]) ?? idle;
    const action = mixer.clipAction(clip);
    if (clip !== idle) action.setLoop(LoopOnce, 1);
    action.reset().play();
    mixer.update(0);
    invalidate();

    const finish = () => {
      mixer.clipAction(idle).reset().play();
    };

    mixer.addEventListener('finished', finish);
    return () => {
      mixer.removeEventListener('finished', finish);
      mixer.stopAllAction();
    };
  }, [bean, enabled, motion, motionRequest, invalidate]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let loaded: typeof bean;

    async function load() {
      const [asset, texture] = await Asset.loadAsync([
        require('../../../assets/models/bean/bean.glb'),
        require('../../../assets/models/bean/bean-texture.png'),
      ]);
      const uri = asset.localUri ?? asset.uri;
      let bytes: ArrayBuffer;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Bean preview unavailable');
        bytes = await response.arrayBuffer();
      } else {
        bytes = await new File(uri).arrayBuffer();
      }
      const loader = new GLTFLoader().register(parser => ({
        name: 'BoraBeanAssets',
        // Resolve bundled files directly so Expo GL does not depend on Blob URLs.
        beforeRoot: async () => {
          for (const image of parser.json.images) {
            if (image.uri === 'bean-texture.png') image.uri = texture.localUri ?? texture.uri;
          }
        },
      }));
      const { scene, animations: clips } = await loader.parseAsync(bytes, '');
      if (cancelled) {
        disposeModel(scene);
        return;
      }
      const colors = createBeanColors();
      loaded = { scene, mixer: new AnimationMixer(scene), clips, colors };
      scene.traverse(node => {
        if (node instanceof Mesh && node.material instanceof MeshStandardMaterial && node.material.map) {
          colors.apply(node.material);
        }
      });
      scene.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(scene, true);
      const center = bounds.getCenter(new Vector3());
      const height = bounds.getSize(new Vector3()).y;
      if (!Number.isFinite(height) || height <= 0) throw new Error('Dimensões inválidas no modelo do Bean');
      const scale = 2.22 / height;
      scene.scale.setScalar(scale);
      scene.position.set(-center.x * scale, BEAN_PREVIEW_FLOOR - bounds.min.y * scale, -center.z * scale);
      setBean(loaded);
    }

    void load().catch((error: unknown) => {
      if (!cancelled) {
        const detail = error instanceof Error ? error.message : String(error);
        setLoadError(new Error(`Falha ao carregar o Bean: ${detail}`));
      }
    });

    return () => {
      cancelled = true;
      if (loaded) {
        loaded.mixer.stopAllAction();
        loaded.mixer.uncacheRoot(loaded.scene);
        disposeModel(loaded.scene);
      }
    };
  }, [enabled]);

  if (enabled && loadError) throw loadError;
  return enabled ? bean?.scene ?? null : null;
}
