"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import type { Ambiente } from "@/components/ui/AmbientPhoto";
import type { Vec3 } from "./types";
import { useWorld } from "./WorldProvider";

/*
 * Lo lejano de un apartado: la foto real de ambiente con su mapa de profundidad (Depth Anything V2, en
 * public/fotos/ambiente/*-depth.webp), con el mismo relieve que las paredes del club (DepthWall en ClubScene): al
 * moverse la cámara, lo cercano de la foto se separa de lo lejano, y en los bordes el relieve se apaga. En el celular
 * usa la foto -sm. Lo que se toca va delante, modelado en 3D por cada escena.
 */

const vert = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDisp;
varying vec2 vUv;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec2 e = smoothstep(vec2(0.0), vec2(0.07), uv) * smoothstep(vec2(0.0), vec2(0.07), 1.0 - uv);
  vec3 p = position + vec3(0.0, 0.0, (d - 0.3) * uDisp * e.x * e.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uDim;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uMap, vUv).rgb * uDim, 1.0);
  #include <colorspace_fragment>
}
`;

export default function DepthBackdrop({ name, position = [0, 2.2, -8], width = 16, disp = 1.3, dim = 0.62 }: { name: Ambiente; position?: Vec3; width?: number; disp?: number; dim?: number }) {
  const small = useWorld()?.small ?? false;
  const [map, depth] = useTexture([`/fotos/ambiente/${name}${small ? "-sm" : ""}.webp`, `/fotos/ambiente/${name}-depth.webp`]);
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
    depth.colorSpace = THREE.NoColorSpace;
    depth.generateMipmaps = false;
    depth.minFilter = THREE.LinearFilter;
    depth.needsUpdate = true;
  }, [map, depth]);
  const height = (width * 9) / 16;
  const geo = useMemo(() => new THREE.PlaneGeometry(width, height, small ? 96 : 160, small ? 54 : 90), [width, height, small]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uMap: { value: map }, uDepth: { value: depth }, uDisp: { value: disp }, uDim: { value: dim } } }),
    [map, depth, disp, dim],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  return <mesh geometry={geo} material={mat} position={position as [number, number, number]} />;
}
