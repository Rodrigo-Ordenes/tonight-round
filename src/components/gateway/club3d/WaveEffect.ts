import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector4 } from "three";

/*
 * La ola en pantalla (postprocesado propio): cada toque, el paso por la puerta o la zambullida en una zona lanzan un
 * anillo que refracta la imagen como agua; al girar rápido, la sala ondula apenas (vaivén) y los colores se separan un
 * poco con la velocidad, como al moverse dentro del agua. Sin ondas vivas ni velocidad, no toca la imagen.
 */

const fragment = /* glsl */ `
uniform vec4 uWaves[4];
uniform float uNow;
uniform float uAspect;
uniform float uSwell;
uniform float uSplit;
uniform float uActive;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uActive < 0.5) {
    outputColor = inputColor;
    return;
  }
  vec2 disp = vec2(0.0);
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 w = uWaves[i];
    float t = uNow - w.z;
    if (w.w <= 0.0 || t < 0.0 || t > 1.6) continue;
    vec2 d = uv - w.xy;
    d.x *= uAspect;
    float dist = length(d);
    float radius = t * 0.62;
    float fade = 1.0 - t / 1.6;
    fade *= fade;
    float band = exp(-pow((dist - radius) * 15.0, 2.0)) * fade * w.w;
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
    dir.x /= uAspect;
    disp += dir * band * 0.02;
    ring += band;
  }
  disp.y += sin(uv.x * 7.0 + uNow * 2.3) * 0.0045 * uSwell;
  disp.x += sin(uv.y * 5.0 + uNow * 1.7) * 0.003 * uSwell;
  float split = uSplit + ring * 0.006;
  vec2 c = uv - 0.5;
  float r = texture2D(inputBuffer, uv + disp + c * split).r;
  float g = texture2D(inputBuffer, uv + disp).g;
  float b = texture2D(inputBuffer, uv + disp - c * split).b;
  outputColor = vec4(vec3(r, g, b) + vec3(0.5, 0.72, 1.0) * ring * 0.07, inputColor.a);
}
`;

export class WaveEffect extends Effect {
  constructor() {
    super("WaveEffect", fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uWaves", new Uniform([new Vector4(), new Vector4(), new Vector4(), new Vector4()])],
        ["uNow", new Uniform(0)],
        ["uAspect", new Uniform(1)],
        ["uSwell", new Uniform(0)],
        ["uSplit", new Uniform(0)],
        ["uActive", new Uniform(0)],
      ]),
    });
  }

  setSize(width: number, height: number) {
    this.uniforms.get("uAspect")!.value = width / Math.max(1, height);
  }

  /** Copia las ondas vivas y la velocidad del momento */
  sync(now: number, waves: [number, number, number, number][], swell: number, split: number) {
    const list = this.uniforms.get("uWaves")!.value as Vector4[];
    let alive = 0;
    for (let i = 0; i < 4; i++) {
      const w = waves[i];
      if (w && now - w[2] < 1.6) {
        list[i].set(w[0], w[1], w[2], w[3]);
        alive++;
      } else list[i].set(0, 0, 0, 0);
    }
    this.uniforms.get("uNow")!.value = now;
    this.uniforms.get("uSwell")!.value = swell;
    this.uniforms.get("uSplit")!.value = split;
    this.uniforms.get("uActive")!.value = alive > 0 || swell > 0.01 || split > 0.0002 ? 1 : 0;
  }
}
