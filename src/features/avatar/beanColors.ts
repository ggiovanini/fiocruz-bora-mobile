import { Color, MeshStandardMaterial, Vector2 } from 'three';

// The texture uses green for the body, blue for the accent, and black for the face.
const bodyInk = new Color('#9cd644');
const accentInk = new Color('#3f95ea');
const determinant = bodyInk.r * accentInk.b - accentInk.r * bodyInk.b;
const bodyWeights = new Vector2(accentInk.b, -accentInk.r).divideScalar(determinant);
const accentWeights = new Vector2(-bodyInk.b, bodyInk.r).divideScalar(determinant);

export function createBeanColors() {
  const bodyChange = new Color(0);
  const accentChange = new Color(0);

  return {
    apply(material: MeshStandardMaterial) {
      material.onBeforeCompile = shader => {
        shader.uniforms.beanBodyChange = { value: bodyChange };
        shader.uniforms.beanAccentChange = { value: accentChange };
        shader.uniforms.beanBodyWeights = { value: bodyWeights };
        shader.uniforms.beanAccentWeights = { value: accentWeights };
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          #ifdef USE_MAP
            vec4 beanTexel = texture2D(map, vMapUv);
            // Recover palette coverage from the original ink, including filtered edges.
            float bodyCoverage = clamp(dot(beanTexel.rb, beanBodyWeights), 0.0, 1.0);
            float accentCoverage = clamp(dot(beanTexel.rb, beanAccentWeights), 0.0, 1.0);
            vec2 uv = fract(vMapUv);
            // The blue chest emblem is isolated inside this part of the UV atlas.
            vec2 emblem = step(vec2(0.36, 0.62), uv) * step(uv, vec2(0.45, 0.71));
            float preserveEmblem = emblem.x * emblem.y * smoothstep(0.04, 0.12, accentCoverage);
            vec3 change = bodyCoverage * beanBodyChange
              + accentCoverage * (1.0 - preserveEmblem) * beanAccentChange;
            diffuseColor *= vec4(clamp(beanTexel.rgb + change, 0.0, 1.0), beanTexel.a);
          #endif
        `);
        shader.fragmentShader = `
          uniform vec3 beanBodyChange;
          uniform vec3 beanAccentChange;
          uniform vec2 beanBodyWeights;
          uniform vec2 beanAccentWeights;
        ${shader.fragmentShader}`;
      };
    },
    update(baseHex?: string, accentHex?: string) {
      bodyChange.set(baseHex ?? bodyInk).sub(bodyInk);
      accentChange.set(accentHex ?? accentInk).sub(accentInk);
    },
  };
}
