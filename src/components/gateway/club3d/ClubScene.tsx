"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, PerformanceMonitor, Sparkles, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { easing } from "maath";
import { ZONAS_CLUB } from "./zonas";
import { addWave, clamp01, smoothstep, type Flow } from "./flow";
import NeonHost, { type HostSpots } from "./NeonHost";
import { WaveEffect } from "./WaveEffect";

/*
 * El club en WebGL (three.js + React Three Fiber), en una sola toma continua que mueve el `flow`:
 *  - Afuera, la puerta con su letrero y el host que te invita a pasar; al bajar (o «Pasar») las hojas se abren, se
 *    filtra la luz y la cámara cruza el umbral.
 *  - Adentro, cinco paredes con fotos reales que tienen profundidad de verdad: un mapa de profundidad (Depth Anything
 *    V2) desplaza cada foto en relieve, así que al moverse la cámara lo cercano se separa de lo lejano. Al mirar una
 *    zona, una ola de neón la recorre de lo cercano a lo lejano.
 *  - En medio, el host de neón, focos que barren el humo al ritmo de la música, piso que refleja y la ola en pantalla.
 */

const N = ZONAS_CLUB.length;
const STEP = (Math.PI * 2) / N;
const R = 6;
const WALL_W = 2 * R * Math.tan(Math.PI / N) + 0.02;
const WALL_H = (WALL_W * 9) / 16;
const EYE = 1.7;
const DOOR_Z = 7.4;
/** Relieve máximo de las fotos (m) */
const DISP = 1.25;
/** Cuánto avanza la cámara al meterse en una zona (m) */
const DIVE = 3.1;
const NEON_BLUE = new THREE.Color("#67AAFF").multiplyScalar(2.4);
const NEON_PURPLE = new THREE.Color("#B93EF3").multiplyScalar(2.4);
const HOT = new THREE.Color("#D793FF").multiplyScalar(1.5);
/** Dónde espera el host afuera (en el celular, más cerca del vano para que quepa) y por dónde cruza la puerta */
const SPOTS: HostSpots = { outside: new THREE.Vector3(2.3, 0, DOOR_Z + 1.3), door: new THREE.Vector3(0.45, 0, DOOR_Z - 0.6) };
const SPOTS_SMALL: HostSpots = { outside: new THREE.Vector3(1.05, 0, DOOR_Z + 2.4), door: new THREE.Vector3(0.3, 0, DOOR_Z - 0.6) };

/** Letrero de neón dibujado en un canvas local (sin fuentes externas: la CSP no deja bajar nada de afuera) */
function useSignTexture(text: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    g.textAlign = "center";
    g.textBaseline = "middle";
    const spaced = text.split("").join(" ");
    let px = 150;
    do {
      g.font = `900 ${px}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      px -= 6;
    } while (g.measureText(spaced).width > c.width - 140 && px > 40);
    for (const [blur, color] of [
      [40, "rgba(185,62,243,0.9)"],
      [18, "rgba(103,170,255,0.9)"],
      [4, "rgba(255,255,255,1)"],
    ] as const) {
      g.shadowBlur = blur;
      g.shadowColor = color;
      g.fillStyle = blur === 4 ? "#F4ECFF" : color;
      g.fillText(spaced, c.width / 2, c.height / 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
}

const wallVert = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDisp;
varying vec2 vUv;
varying float vD;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vD = d;
  // En los bordes el relieve se apaga: las esquinas quedan a ras con la pared vecina
  vec2 e = smoothstep(vec2(0.0), vec2(0.07), uv) * smoothstep(vec2(0.0), vec2(0.07), 1.0 - uv);
  vec3 p = position + vec3(0.0, 0.0, (d - 0.3) * uDisp * e.x * e.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const wallFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uDim;
uniform float uScan;
uniform float uBeat;
uniform vec3 uScanA;
uniform vec3 uScanB;
varying vec2 vUv;
varying float vD;
void main() {
  vec3 c = texture2D(uMap, vUv).rgb * uDim;
  // La ola de luz: una franja de neón que recorre la zona en profundidad, de lo cercano a lo lejano
  if (uScan > -0.4 && uScan < 1.4) {
    float front = 1.0 - uScan;
    float band = exp(-pow((vD - front) * 20.0, 2.0));
    float wake = smoothstep(front, front + 0.3, vD) * (1.0 - smoothstep(0.2, 1.4, uScan));
    vec3 sc = mix(uScanA, uScanB, vUv.x);
    c += sc * (band * 1.25 + wake * 0.1);
  }
  // Lo cercano late apenas con la música
  c *= 1.0 + 0.07 * pow(1.0 - fract(uBeat), 4.0) * vD * uDim;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

type Pixels = { data: Uint8ClampedArray; w: number; h: number };
/** Lee el mapa de profundidad en la CPU (chico) para poner cada punto de neón a la altura real del objeto */
function readPixels(img: CanvasImageSource & { width: number; height: number }): Pixels | null {
  try {
    const w = 96;
    const h = 54;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, w, h);
    return { data: g.getImageData(0, 0, w, h).data, w, h };
  } catch {
    return null;
  }
}
const depthAt = (px: Pixels | null, u: number, v: number) => {
  if (!px) return 0.5;
  const x = Math.min(px.w - 1, Math.max(0, Math.round(u * (px.w - 1))));
  const y = Math.min(px.h - 1, Math.max(0, Math.round(v * (px.h - 1))));
  return px.data[(y * px.w + x) * 4] / 255;
};

function DepthWall({
  i,
  map,
  depth,
  pixels,
  flow,
  onPick,
  active,
  small,
}: {
  i: number;
  map: THREE.Texture;
  depth: THREE.Texture;
  pixels: Pixels | null;
  flow: React.MutableRefObject<Flow>;
  onPick: (i: number, x: number, y: number) => void;
  active: boolean;
  small: boolean;
}) {
  const z = ZONAS_CLUB[i];
  const a = i * STEP;
  const sign = useSignTexture(z.sign);
  const ring = useRef<THREE.Mesh>(null);
  const signMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const dotMat = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const geo = useMemo(() => new THREE.PlaneGeometry(WALL_W, WALL_H, small ? 96 : 160, small ? 54 : 90), [small]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: wallVert,
        fragmentShader: wallFrag,
        uniforms: {
          uMap: { value: map },
          uDepth: { value: depth },
          uDisp: { value: DISP },
          uDim: { value: 0.55 },
          uScan: { value: -1 },
          uBeat: { value: 0 },
          uScanA: { value: new THREE.Color("#67AAFF").multiplyScalar(1.6) },
          uScanB: { value: new THREE.Color("#B93EF3").multiplyScalar(1.6) },
        },
      }),
    [map, depth],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  // El punto de neón flota justo delante del objeto real (su relieve leído del mapa de profundidad)
  const [hu, hv] = z.hotspot;
  const edge = smoothstep(0, 0.07, hu) * smoothstep(0, 0.07, 1 - hu) * smoothstep(0, 0.07, hv) * smoothstep(0, 0.07, 1 - hv);
  const hz = (depthAt(pixels, hu, hv) - 0.3) * DISP * edge + 0.12;
  const hx = (hu - 0.5) * WALL_W;
  const hy = (0.5 - hv) * WALL_H;

  useFrame((state, dt) => {
    const f = flow.current;
    const t = state.clock.elapsedTime;
    const u = mat.uniforms;
    u.uDim.value = THREE.MathUtils.damp(u.uDim.value, active ? 1 : 0.5, 3, dt);
    u.uBeat.value = f.beat;
    u.uScan.value = active && !f.reduce ? (f.time - f.zoneAt) / 1.7 - 0.12 : -1;
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.12 + (hover ? 0.25 : 0));
    // Al meterse en la zona, su punto se apaga (la cámara queda encima: encandilaría)
    const gone = f.depth > 1.25 && active ? 0 : 1;
    if (ringMat.current) easing.damp(ringMat.current, "opacity", 0.95 * gone, 0.2, dt);
    if (dotMat.current) easing.damp(dotMat.current, "opacity", gone, 0.2, dt);
    if (signMat.current) {
      const flicker = active && Math.sin(t * 23) > 0.97 ? 0.55 : 1;
      easing.damp(signMat.current, "opacity", (active ? 1 : 0.35) * flicker, 0.25, dt);
    }
  });

  return (
    <group position={[Math.sin(a) * R, WALL_H / 2, -Math.cos(a) * R]} rotation={[0, -a, 0]}>
      <mesh geometry={geo} material={mat} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(sd * WALL_W) / 2, 0, 0.02]}>
          <boxGeometry args={[0.035, WALL_H * 0.92, 0.035]} />
          <meshBasicMaterial color={sd < 0 ? NEON_BLUE : NEON_PURPLE} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={small ? [0, WALL_H * 0.12, 0.3] : [WALL_W * 0.2, WALL_H * 0.3, 0.3]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial ref={signMat} map={sign} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <group position={[hx, hy, hz]}>
        <mesh
          ref={ring}
          onClick={(e) => {
            e.stopPropagation();
            // Si fue un arrastre para mirar alrededor, no cuenta como toque
            if (e.delta > 8) return;
            onPick(i, (e.pointer.x + 1) / 2, (e.pointer.y + 1) / 2);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "";
          }}
        >
          <ringGeometry args={[0.16, 0.22, 48]} />
          <meshBasicMaterial ref={ringMat} color={HOT} toneMapped={false} transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.07, 32]} />
          <meshBasicMaterial ref={dotMat} color={new THREE.Color("#F4ECFF").multiplyScalar(2)} toneMapped={false} transparent />
        </mesh>
      </group>
    </group>
  );
}

/** La puerta del club: muro oscuro con el vano, marco de neón, letrero y dos hojas acolchadas que giran en sus bisagras */
function Door({ flow }: { flow: React.MutableRefObject<Flow> }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const leak = useRef<THREE.PointLight>(null);
  const sign = useSignTexture("TONIGHT");
  const leather = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#3a1050");
    grad.addColorStop(1, "#14061c");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    for (let y = 16; y < 256; y += 32)
      for (let x = 16 + ((y / 32) % 2) * 16; x < 256; x += 32) {
        g.fillStyle = "rgba(0,0,0,0.55)";
        g.beginPath();
        g.arc(x, y, 3, 0, Math.PI * 2);
        g.fill();
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 4);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame((_, dt) => {
    const f = flow.current;
    // Las hojas se abren con el gesto (hacia adentro) y se entreabren solas cuando invitan a pasar
    const open = Math.min(1, smoothstep(0, 0.42, f.depth) + f.ajar * 0.22) * 1.85;
    if (left.current) easing.damp(left.current.rotation, "y", open, f.reduce ? 0.01 : 0.18, dt);
    if (right.current) easing.damp(right.current.rotation, "y", -open, f.reduce ? 0.01 : 0.18, dt);
    // La luz de adentro se filtra por la rendija
    if (leak.current) leak.current.intensity = 22 * Math.min(1, open / 1.2);
  });
  const ow = 2.8;
  const oh = 3.3;
  return (
    <group position={[0, 0, DOOR_Z]}>
      <mesh position={[-(ow / 2 + 10), 6, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#0c0c11" roughness={0.9} />
      </mesh>
      <mesh position={[ow / 2 + 10, 6, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#0c0c11" roughness={0.9} />
      </mesh>
      <mesh position={[0, oh + 4.35, 0]}>
        <planeGeometry args={[ow, 8.7]} />
        <meshStandardMaterial color="#0c0c11" roughness={0.9} />
      </mesh>
      {[
        [0, oh + 0.06, ow + 0.2, 0.06],
        [-ow / 2 - 0.06, oh / 2, 0.06, oh + 0.1],
        [ow / 2 + 0.06, oh / 2, 0.06, oh + 0.1],
      ].map(([x, y, w, h], k) => (
        <mesh key={k} position={[x, y, 0.05]}>
          <boxGeometry args={[w, h, 0.05]} />
          <meshBasicMaterial color={k === 1 ? NEON_BLUE : NEON_PURPLE} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, oh + 0.85, 0.06]}>
        <planeGeometry args={[3.4, 0.85]} />
        <meshBasicMaterial map={sign} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <group ref={left} position={[-ow / 2, 0, 0]}>
        <mesh position={[ow / 4, oh / 2, 0]}>
          <boxGeometry args={[ow / 2 - 0.02, oh, 0.08]} />
          <meshStandardMaterial map={leather} roughness={0.55} metalness={0.1} emissive="#2a0c3a" emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[ow / 2 - 0.14, oh / 2, 0.06]}>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#E4B853" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      <group ref={right} position={[ow / 2, 0, 0]}>
        <mesh position={[-ow / 4, oh / 2, 0]}>
          <boxGeometry args={[ow / 2 - 0.02, oh, 0.08]} />
          <meshStandardMaterial map={leather} roughness={0.55} metalness={0.1} emissive="#2a0c3a" emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[-ow / 2 + 0.14, oh / 2, 0.06]}>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#E4B853" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      <pointLight position={[0, oh + 0.6, 1.4]} intensity={16} distance={9} color="#89BDFF" />
      <pointLight ref={leak} position={[0, 1.4, -1.2]} intensity={0} distance={7} color="#B93EF3" />
    </group>
  );
}

/**
 * La cámara: afuera mirando la puerta → cruza el umbral → en medio del club mirando la zona → se mete en ella. Al girar
 * rápido se aleja un poco y abre el lente (la ola sube) y al asentarse vuelve (la ola baja); se inclina apenas hacia el
 * giro; respira; y el puntero la corre un poco para que el relieve de las fotos se note.
 */
function CameraRig({ flow, small }: { flow: React.MutableRefObject<Flow>; small: boolean }) {
  const { camera, pointer, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const baseFov = small ? 62 : 52;
  // Afuera, lo bastante atrás para que entren la puerta, su letrero y el host
  const startZ = DOOR_Z + Math.max(small ? 3.8 : 6.4, 2.2 / (Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) * aspect));
  const look = useRef(new THREE.Vector2());
  const aim = useMemo(() => new THREE.Vector2(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const f = flow.current;
    const t = state.clock.elapsedTime;
    const d = f.depth;
    const walk = smoothstep(0.1, 1, d);
    const dive = smoothstep(1, 2, d);
    const swell = f.reduce ? 0 : clamp01(Math.abs(f.yawVel) * 0.45);
    // Giro: afuera mira la puerta; al entrar gira hacia la zona (por el camino corto)
    const zoneYaw = -f.yaw * STEP;
    const wrapped = Math.atan2(Math.sin(zoneYaw), Math.cos(zoneYaw));
    const yaw = zoneYaw - (1 - smoothstep(0.3, 0.95, d)) * wrapped;
    if (!f.reduce) look.current.lerp(aim.set(Math.max(-1, Math.min(1, pointer.x + f.tiltX)), Math.max(-1, Math.min(1, pointer.y + f.tiltY))), 1 - Math.exp(-3 * dt));
    const lx = f.reduce ? 0 : look.current.x;
    const ly = f.reduce ? 0 : look.current.y;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    // Del exterior al centro, y al meterse avanza hacia la pared
    const ease = walk * walk * (3 - 2 * walk);
    pos.set(0, EYE, startZ * (1 - ease));
    const push = dive * DIVE - swell * 0.55 * walk;
    pos.x += fx * push;
    pos.z += fz * push;
    // Paralaje con el puntero (de lado, en el eje derecho de la cámara) y una respiración lenta
    const side = (lx * 0.24 + Math.sin(t * 0.23) * 0.06) * (f.reduce ? 0 : 1);
    pos.x += Math.cos(yaw) * side;
    pos.z += -Math.sin(yaw) * side;
    pos.y += ly * 0.1 + Math.sin(t * 0.31) * 0.035 - dive * 0.15;
    camera.position.copy(pos);
    camera.rotation.set(ly * 0.035 + (1 - walk) * 0.04, yaw - lx * 0.03, -f.yawVel * 0.012, "YXZ");
    const cam = camera as THREE.PerspectiveCamera;
    const fov = baseFov + swell * 6 - dive * 10;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

const beamVert = /* glsl */ `
varying float vY;
varying vec3 vN;
varying vec3 vV;
void main() {
  vY = clamp(-position.y / 5.6, 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const beamFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
varying float vY;
varying vec3 vN;
varying vec3 vV;
void main() {
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  float a = pow(1.0 - vY, 1.5) * edge * uI;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;

/** Focos del techo que barren el humo; laten con el bombo y se encienden a medida que se entra */
function Beams({ flow }: { flow: React.MutableRefObject<Flow> }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(1.05, 5.6, 32, 1, true);
    g.translate(0, -2.8, 0);
    return g;
  }, []);
  const items = useMemo(
    () =>
      [
        { p: [-3.1, WALL_H - 0.1, -1.8], c: "#67AAFF" },
        { p: [3.0, WALL_H - 0.1, -2.3], c: "#B93EF3" },
        { p: [0.6, WALL_H - 0.1, 3.1], c: "#8CE3BE" },
        { p: [-2.2, WALL_H - 0.1, 2.5], c: "#B93EF3" },
      ].map(({ p, c }) => ({
        p: p as [number, number, number],
        mat: new THREE.ShaderMaterial({
          vertexShader: beamVert,
          fragmentShader: beamFrag,
          uniforms: { uColor: { value: new THREE.Color(c) }, uI: { value: 0 } },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      })),
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useEffect(
    () => () => {
      geo.dispose();
      items.forEach((it) => it.mat.dispose());
    },
    [geo, items],
  );
  useFrame((state) => {
    const f = flow.current;
    const t = state.clock.elapsedTime;
    const kick = Math.pow(1 - (f.beat % 1), 3);
    const inside = smoothstep(0.05, 0.9, f.depth);
    items.forEach((it, i) => {
      const m = refs.current[i];
      if (!m) return;
      const sp = f.reduce ? 0 : 1;
      m.rotation.x = Math.sin(t * 0.45 * sp + i * 1.3) * 0.55;
      m.rotation.z = Math.cos(t * 0.33 * sp + i * 2.1) * 0.5;
      it.mat.uniforms.uI.value = (0.1 + 0.07 * kick) * inside;
    });
  });
  return (
    <>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={geo}
          material={it.mat}
          position={it.p}
          renderOrder={1}
        />
      ))}
    </>
  );
}

function Room({ flow, onPick, active, small, mirror }: { flow: React.MutableRefObject<Flow>; onPick: (i: number, x: number, y: number) => void; active: number; small: boolean; mirror: boolean }) {
  const maps = useTexture(ZONAS_CLUB.map((z) => `/fotos/ambiente/${z.foto}${small ? "-sm" : ""}.webp`));
  const depths = useTexture(ZONAS_CLUB.map((z) => `/fotos/ambiente/${z.foto}-depth.webp`));
  useMemo(() => {
    maps.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
    });
    depths.forEach((t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [maps, depths]);
  const pixels = useMemo(() => depths.map((t) => readPixels(t.image as HTMLImageElement)), [depths]);
  return (
    <>
      {ZONAS_CLUB.map((z, i) => (
        <DepthWall key={z.id} i={i} map={maps[i]} depth={depths[i]} pixels={pixels[i]} flow={flow} onPick={onPick} active={i === active} small={small} />
      ))}
      {/* Piso: espejo oscuro y mojado que refleja el neón (en el celular, uno simple que pesa menos) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[R * 2.4, 64]} />
        {!mirror ? (
          <meshStandardMaterial color="#09090d" roughness={0.35} metalness={0.6} />
        ) : (
          <MeshReflectorMaterial resolution={512} mirror={0.6} blur={[300, 80]} mixBlur={1} mixStrength={2.4} roughness={0.85} depthScale={0.6} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#0a0a10" metalness={0.5} />
        )}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H + 0.01, 0]}>
        <circleGeometry args={[R * 1.3, 64]} />
        <meshBasicMaterial color="#060609" />
      </mesh>
      <Beams flow={flow} />
      <Sparkles count={small ? 40 : 90} scale={[R * 1.6, 3.2, R * 1.6]} position={[0, 1.8, 0]} size={2.2} speed={0.25} opacity={0.6} color="#D793FF" />
      <Sparkles count={small ? 20 : 50} scale={[R * 1.6, 3, R * 1.6]} position={[0, 2, 0]} size={1.6} speed={0.18} opacity={0.5} color="#89BDFF" />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 3.6, 0]} intensity={14} distance={14} color="#B93EF3" />
      <pointLight position={[0, 0.4, -3]} intensity={6} distance={9} color="#67AAFF" />
    </>
  );
}

/** La ola en pantalla: copia al postprocesado las ondas vivas y la velocidad de la cámara */
function WavePass({ flow }: { flow: React.MutableRefObject<Flow> }) {
  const effect = useMemo(() => new WaveEffect(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(() => {
    const f = flow.current;
    effect.sync(f.time, f.waves, f.reduce ? 0 : clamp01(Math.abs(f.yawVel) * 0.5), f.reduce ? 0 : Math.min(0.006, Math.abs(f.depthVel) * 0.0025 + Math.abs(f.yawVel) * 0.0012));
  });
  return <primitive object={effect} dispose={null} />;
}

/**
 * El lienzo 3D. `flow` es el motor compartido con la interfaz; `onPick` avisa que se tocó el punto de una zona (con su
 * posición en pantalla, para que la ola nazca ahí). Se monta solo en el navegador (import dinámico) y avisa con
 * `onReady` cuando la sala ya cargó sus fotos.
 */
export default function ClubScene({
  flow,
  active,
  onPick,
  onReady,
  small,
  paused = false,
}: {
  flow: React.MutableRefObject<Flow>;
  active: number;
  onPick: (i: number) => void;
  onReady: () => void;
  small: boolean;
  paused?: boolean;
}) {
  const pick = (i: number, x: number, y: number) => {
    addWave(flow.current, x, y, 0.9);
    onPick(i);
  };
  // Calidad que se adapta al equipo: si no alcanza los cuadros, baja la resolución, saca el piso espejo y el grano;
  // si le sobra, los vuelve a poner (2 alta, 1 media, 0 liviana)
  const top = small ? 1 : 2;
  const [tier, setTier] = useState<0 | 1 | 2>(top);
  return (
    <Canvas
      // Fuera de la vista (o con la pestaña oculta) no se dibuja: no gasta batería ni CPU
      frameloop={paused ? "never" : "always"}
      dpr={tier === 2 ? [1, 1.75] : tier === 1 ? [1, 1.4] : 1}
      camera={{ fov: small ? 62 : 52, near: 0.05, far: 60, position: [0, EYE, 16] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#060609");
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setTier((t) => (t > 0 ? ((t - 1) as 0 | 1) : 0))}
        onIncline={() => setTier((t) => (t < top ? ((t + 1) as 1 | 2) : t))}
        onFallback={() => setTier(0)}
      />
      <fog attach="fog" args={["#07060c", 11, 32]} />
      <CameraRig flow={flow} small={small} />
      {/* La puerta y el host aparecen de inmediato; la sala, cuando cargan sus fotos */}
      <Door flow={flow} />
      <NeonHost flow={flow} small={small} spots={small ? SPOTS_SMALL : SPOTS} />
      <React.Suspense fallback={null}>
        <Room flow={flow} onPick={pick} active={active} small={small} mirror={tier === 2} />
        <Ready onReady={onReady} />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <WavePass flow={flow} />
          <Bloom mipmapBlur intensity={small ? 0.85 : 1.15} luminanceThreshold={0.62} luminanceSmoothing={0.2} />
          <Noise opacity={tier === 0 ? 0 : 0.035} />
          <Vignette eskil={false} offset={0.22} darkness={0.72} />
        </EffectComposer>
      </React.Suspense>
    </Canvas>
  );
}

/** Avisa una vez que todo lo de adentro del Suspense ya cargó (las fotos de la sala) */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
