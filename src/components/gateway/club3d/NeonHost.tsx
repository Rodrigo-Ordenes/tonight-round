"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HOST_PARENT, HOST_PIVOTS, HOST_STROKES, type HostPart } from "./hostNeon";
import { smoothstep, type Flow } from "./flow";

/*
 * El host en 3D: un letrero de neón de tubos reales (geometría de tubo con brillo propio y bloom) que te recibe en la
 * puerta, entra contigo y se queda en medio del club presentando cada zona. Nace de una ola de luz (partículas que
 * ondulan a su cintura), sus tubos se encienden uno a uno como un letrero de verdad y una onda de luz le sube por el
 * cuerpo al ritmo de la música. Te mira: la cabeza sigue al puntero.
 */

const CM = 0.01;
const RADIUS = 0.0064;
const WAIST_Y = 0.97;
const PARTS: HostPart[] = ["body", "head", "armAUp", "armAFore", "armBUp", "armBFore"];
const BLUE = new THREE.Color("#67AAFF");
const PURPLE = new THREE.Color("#B93EF3");
const MINT = new THREE.Color("#8CE3BE");

const neonVert = /* glsl */ `
attribute vec2 aHost;
attribute float aIgnite;
attribute float aTone;
varying vec2 vHost;
varying float vIgnite;
varying float vTone;
varying vec3 vN;
varying vec3 vV;
void main() {
  vHost = aHost;
  vIgnite = aIgnite;
  vTone = aTone;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const neonFrag = /* glsl */ `
uniform float uTime;
uniform float uIgnite;
uniform float uWave;
uniform float uOpacity;
uniform float uBeat;
uniform vec3 uBlue;
uniform vec3 uPurple;
uniform vec3 uMint;
varying vec2 vHost;
varying float vIgnite;
varying float vTone;
varying vec3 vN;
varying vec3 vV;
float hash(float n) { return fract(sin(n) * 43758.5453123); }
void main() {
  // Encendido: cada tubo prende en su turno (de la cintura hacia arriba) y parpadea un instante, como un letrero real
  float since = uIgnite - vIgnite * 0.8;
  if (since < 0.0) discard;
  float flick = since < 0.2 ? step(0.42, hash(floor(uTime * 28.0) + vIgnite * 97.0)) : 1.0;
  vec3 base = mix(uBlue, uPurple, smoothstep(-0.34, 0.44, vHost.x));
  base = mix(base, uMint, vTone);
  // El centro del tubo, de frente a la cámara, se ve más caliente (casi blanco); los bordes, saturados
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  vec3 col = mix(base, vec3(1.0), pow(ndv, 5.0) * 0.32);
  // La onda de luz que le sube por el cuerpo y el latido de la música
  float wave = exp(-pow((vHost.y - uWave) * 6.5, 2.0));
  float beat = 0.86 + 0.14 * pow(1.0 - fract(uBeat), 3.0);
  float intensity = (1.4 + wave * 2.0) * beat * flick;
  gl_FragColor = vec4(col * intensity * uOpacity, 1.0);
}
`;

const waveVert = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uSpread;
uniform float uOpacity;
uniform float uPixel;
uniform vec3 uBlue;
uniform vec3 uPurple;
uniform vec3 uMint;
varying float vA;
varying vec3 vC;
void main() {
  float ang = aSeed.x + uTime * 0.11 * (0.35 + aSeed.z);
  float r = mix(0.1, 0.9, aSeed.y) * (1.0 + uSpread * 1.8);
  vec3 p = vec3(cos(ang) * r, 0.0, sin(ang) * r * 0.55);
  // Crestas que viajan hacia afuera y alrededor: la ola de la que nace el host
  float swell = sin(r * 10.0 - uTime * 2.1) * 0.05 * (1.0 - aSeed.y * 0.45) + sin(ang * 3.0 + uTime * 1.25) * 0.028;
  p.y = swell + aSeed.z * 0.018;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPixel * (0.55 + aSeed.z) * (5.5 / max(0.5, -mv.z));
  gl_Position = projectionMatrix * mv;
  float crest = smoothstep(0.015, 0.07, swell);
  vC = mix(mix(uBlue, uPurple, 0.5 + 0.5 * cos(ang)), uMint, crest * 0.65);
  vA = (1.0 - smoothstep(0.62, 1.0, aSeed.y)) * uOpacity * (0.45 + 0.55 * crest);
}
`;

const waveFrag = /* glsl */ `
varying float vA;
varying vec3 vC;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vC * a * vA * 1.5, 1.0);
}
`;

/** Arma los tubos de cada parte en su propio espacio (respecto de su bisagra), unidos en una sola geometría */
function buildParts() {
  const ys = HOST_STROKES.map((s) => s.pts.reduce((a, p) => a + p[1], 0) / s.pts.length);
  // Orden de encendido: de la cintura (abajo) hacia la cabeza
  const order = ys.map((y, i) => [y, i] as const).sort((a, b) => b[0] - a[0]);
  const rank = new Map(order.map(([, i], k) => [i, k / Math.max(1, order.length - 1)]));
  const out = {} as Record<HostPart, THREE.BufferGeometry>;
  for (const part of PARTS) {
    const [px, py] = HOST_PIVOTS[part];
    const geos: THREE.BufferGeometry[] = [];
    HOST_STROKES.forEach((s, i) => {
      if (s.part !== part) return;
      const pts = s.pts.map(([x, y]) => new THREE.Vector3((x - px) * CM, -(y - py) * CM, (s.z ?? 0) * CM));
      const curve = new THREE.CatmullRomCurve3(pts, !!s.closed, "centripetal");
      const seg = Math.max(6, Math.round(curve.getLength() / 0.007));
      const g = new THREE.TubeGeometry(curve, seg, RADIUS, 6, !!s.closed);
      g.deleteAttribute("uv");
      const n = g.attributes.position.count;
      const host = new Float32Array(n * 2);
      const ignite = new Float32Array(n).fill(rank.get(i) ?? 0);
      const tone = new Float32Array(n).fill(s.tone === "mint" ? 1 : 0);
      for (let k = 0; k < n; k++) {
        host[k * 2] = g.attributes.position.getX(k) + px * CM;
        host[k * 2 + 1] = g.attributes.position.getY(k) + (92 - py) * CM;
      }
      g.setAttribute("aHost", new THREE.BufferAttribute(host, 2));
      g.setAttribute("aIgnite", new THREE.BufferAttribute(ignite, 1));
      g.setAttribute("aTone", new THREE.BufferAttribute(tone, 1));
      geos.push(g);
    });
    out[part] = mergeGeometries(geos)!;
    geos.forEach((g) => g.dispose());
  }
  return out;
}

export interface HostSpots {
  /** Dónde espera afuera, junto a la puerta */
  outside: THREE.Vector3;
  /** El paso por el vano de la puerta */
  door: THREE.Vector3;
}

export default function NeonHost({ flow, small, spots }: { flow: React.MutableRefObject<Flow>; small: boolean; spots: HostSpots }) {
  const { camera, pointer, gl } = useThree();
  const geos = useMemo(buildParts, []);
  const root = useRef<THREE.Group>(null);
  const groups = useRef<Partial<Record<HostPart, THREE.Group | null>>>({});
  const hostYaw = useRef<number | null>(null);
  const born = useRef<number | null>(null);
  const present = useRef(0);
  const lastZone = useRef(0);

  const neon = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: neonVert,
        fragmentShader: neonFrag,
        uniforms: {
          uTime: { value: 0 },
          uIgnite: { value: 0 },
          uWave: { value: -1 },
          uOpacity: { value: 1 },
          uBeat: { value: 0 },
          uBlue: { value: BLUE.clone().multiplyScalar(1.15) },
          uPurple: { value: PURPLE.clone().multiplyScalar(1.15) },
          uMint: { value: MINT.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  const count = small ? 700 : 1500;
  const waveGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seed[i * 3] = Math.random() * Math.PI * 2;
      seed[i * 3 + 1] = Math.pow(Math.random(), 0.8);
      seed[i * 3 + 2] = Math.random();
    }
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    // Posiciones de relleno: el sombreador las calcula; el volumen evita que se descarte por estar fuera de cámara
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
    return g;
  }, [count]);
  const waveMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        uniforms: {
          uTime: { value: 0 },
          uSpread: { value: 0 },
          uOpacity: { value: 1 },
          uPixel: { value: 2 },
          uBlue: { value: BLUE.clone() },
          uPurple: { value: PURPLE.clone() },
          uMint: { value: MINT.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      neon.dispose();
      waveGeo.dispose();
      waveMat.dispose();
    },
    [geos, neon, waveGeo, waveMat],
  );

  const target = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const f = flow.current;
    const t = state.clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    if (born.current === null) born.current = t + 0.35;
    const d = f.depth;
    const dive = smoothstep(1.02, 1.55, d);

    // --- Dónde está: afuera junto a la puerta → cruza el vano → su lugar adentro, que sigue a la mirada con retardo ---
    const camYaw = camera.rotation.y;
    if (hostYaw.current === null) hostYaw.current = camYaw;
    hostYaw.current = THREE.MathUtils.damp(hostYaw.current, camYaw, f.reduce ? 60 : 2.3, dt);
    const offX = small ? 0.5 : 1.38;
    const dist = small ? 3.9 : 3.05;
    const sy = Math.sin(hostYaw.current);
    const cy = Math.cos(hostYaw.current);
    // Adentro: delante de la cámara (que mira hacia -z rotada), un poco a la derecha; al zambullirse se corre y se hunde
    const sideOut = offX + dive * (small ? 1.2 : 1.4);
    const inside = tmp.set(sideOut * cy - dist * sy, 0, -sideOut * sy - dist * cy);
    const path = smoothstep(0.02, 0.82, d);
    if (path < 0.5) target.lerpVectors(spots.outside, spots.door, smoothstep(0, 1, path * 2));
    else target.lerpVectors(spots.door, inside, smoothstep(0, 1, (path - 0.5) * 2));
    g.position.x = THREE.MathUtils.damp(g.position.x, target.x, f.reduce ? 60 : 4, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, target.z, f.reduce ? 60 : 4, dt);
    // En el celular flota un poco más alto: queda sobre la carta y los botones
    g.position.y = WAIST_Y + (small ? 0.2 * smoothstep(0.3, 0.9, d) : 0) + Math.sin(t * 1.1) * 0.018 - dive * 1.15;
    // Mira a la cámara, apenas girado hacia la zona que presenta
    const face = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z) - (d > 0.6 ? 0.2 : 0);
    let dy = face - g.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    g.rotation.y += dy * (1 - Math.exp(-5 * dt));

    // --- Encendido, onda de luz, latido ---
    neon.uniforms.uTime.value = t;
    neon.uniforms.uBeat.value = f.beat;
    neon.uniforms.uIgnite.value = f.reduce ? 2 : Math.max(0, (t - born.current) / 1.5);
    // La onda sube por el cuerpo una vez por compás (cuatro tiempos)
    neon.uniforms.uWave.value = ((f.beat % 4) / 4) * 1.35 - 0.2;
    neon.uniforms.uOpacity.value = 1 - smoothstep(0.25, 0.9, dive);
    waveMat.uniforms.uTime.value = t;
    waveMat.uniforms.uSpread.value = dive;
    waveMat.uniforms.uOpacity.value = 1 - smoothstep(0.7, 1, dive) * 0.6;
    waveMat.uniforms.uPixel.value = gl.getPixelRatio() * (small ? 2.2 : 2);

    // --- Gestos: respira, la cabeza te sigue, agita la coctelera a ratos y con la otra mano invita a pasar ---
    const p = groups.current;
    if (p.body) {
      p.body.scale.y = 1 + Math.sin(t * 1.3) * 0.006;
      p.body.rotation.z = Math.sin(t * 0.7) * 0.014;
    }
    if (p.head) {
      p.head.rotation.y = THREE.MathUtils.damp(p.head.rotation.y, f.reduce ? 0 : pointer.x * 0.35, 4, dt);
      p.head.rotation.x = THREE.MathUtils.damp(p.head.rotation.x, f.reduce ? 0 : -pointer.y * 0.12, 4, dt);
      p.head.rotation.z = Math.sin(t * 0.9) * 0.04;
    }
    // La coctelera: ráfagas de 1,3 s cada ~5 s
    const cycle = (t + 1.2) % 5.2;
    const env = cycle < 1.3 ? Math.sin((cycle / 1.3) * Math.PI) : 0;
    if (p.armAFore) p.armAFore.rotation.z = Math.sin(t * 36) * 0.13 * env;
    if (p.armAUp) p.armAUp.rotation.z = Math.sin(t * 36 + 1.4) * 0.035 * env;
    // Al cambiar de zona, la presenta con un gesto amplio que se asienta
    const zone = Math.round(f.yawTarget);
    if (zone !== lastZone.current) {
      lastZone.current = zone;
      present.current = 1;
    }
    present.current = Math.max(0, present.current - dt * 0.9);
    const atDoor = 1 - smoothstep(0.25, 0.6, d);
    // En la puerta: «pase, adelante» (barre el aire con la mano abierta); adentro: la mano que presenta la zona
    const sweep = (0.5 + 0.5 * Math.sin(t * 3.4)) * 0.42;
    const presentLift = Math.sin(present.current * Math.PI) * 0.3;
    if (p.armBFore) p.armBFore.rotation.z = THREE.MathUtils.damp(p.armBFore.rotation.z, atDoor * sweep + (1 - atDoor) * (0.06 + presentLift + Math.sin(t * 1.6) * 0.03), 9, dt);
    if (p.armBUp) p.armBUp.rotation.z = THREE.MathUtils.damp(p.armBUp.rotation.z, atDoor * 0.1 + (1 - atDoor) * presentLift * 0.3, 6, dt);
  });

  // Jerarquía de grupos con cada bisagra en su lugar (relativa a la de su padre)
  const node = (part: HostPart): React.ReactNode => {
    const [px, py] = HOST_PIVOTS[part];
    const parent = HOST_PARENT[part];
    const [qx, qy] = parent ? HOST_PIVOTS[parent] : [0, 92];
    const kids = PARTS.filter((k) => HOST_PARENT[k] === part);
    return (
      <group
        key={part}
        ref={(el) => {
          groups.current[part] = el;
        }}
        position={[(px - qx) * CM, -(py - qy) * CM, 0]}
      >
        <mesh geometry={geos[part]} material={neon} frustumCulled={false} renderOrder={3} />
        {kids.map(node)}
      </group>
    );
  };

  return (
    <group ref={root} position={[spots.outside.x, WAIST_Y, spots.outside.z]}>
      {node("body")}
      <points geometry={waveGeo} material={waveMat} position={[0, -0.02, 0]} frustumCulled={false} renderOrder={2} />
    </group>
  );
}
