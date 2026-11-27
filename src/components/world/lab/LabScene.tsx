"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import DepthBackdrop from "../DepthBackdrop";
import { useWorld } from "../WorldProvider";
import type { WorldAnchor } from "../types";
import { LAB_ROOM } from "./labRoom";

/*
 * La escena del laboratorio: la foto del bar con su relieve al fondo (lo lejano) y, delante, dos cajas y una mesa (lo
 * que se toca, en 3D de verdad). En el nivel 1 solo queda la foto: los botones siguen sobre el lugar de cada objeto.
 * Mide los cuadros por segundo en <html data-fps> para el reporte.
 */

const COLOR: Record<string, string> = { azul: "#67AAFF", morado: "#B93EF3", mesa: "#8CE3BE" };

function LabObject({ a }: { a: WorldAnchor }) {
  const world = useWorld()!;
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  const on = world.view === a.id;
  useFrame((_, dt) => {
    const m = mat.current;
    if (m) m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, on || hover ? 0.85 : 0.22, 6, dt);
  });
  return (
    <mesh
      position={a.at as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        // Si fue un arrastre para mirar, no cuenta como elegir
        if (e.delta > 8) return;
        world.go(a.id);
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
      <boxGeometry args={a.size as [number, number, number]} />
      <meshStandardMaterial ref={mat} color={COLOR[a.id]} emissive={COLOR[a.id]} emissiveIntensity={0.22} roughness={0.35} metalness={0.2} />
    </mesh>
  );
}

function FpsMeter() {
  const acc = useRef({ frames: 0, t0: 0 });
  useFrame(() => {
    const a = acc.current;
    const now = performance.now();
    if (!a.t0) a.t0 = now;
    a.frames++;
    if (now - a.t0 >= 1000) {
      document.documentElement.dataset.fps = String(Math.round((a.frames * 1000) / (now - a.t0)));
      a.frames = 0;
      a.t0 = now;
    }
  });
  return null;
}

export default function LabScene() {
  const world = useWorld()!;
  const full = world.sceneLevel === 2;
  return (
    <>
      <fog attach="fog" args={["#07060c", 9, 26]} />
      <DepthBackdrop name="bar" position={[0, 2.4, -7]} width={17} />
      {full && (
        <>
          {LAB_ROOM.anchors.map((a) => (
            <LabObject key={a.id} a={a} />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[12, 48]} />
            <meshStandardMaterial color="#09090d" roughness={0.4} metalness={0.55} />
          </mesh>
        </>
      )}
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 3.6, 2.5]} intensity={26} distance={14} color="#B93EF3" />
      <pointLight position={[-3, 2, 3]} intensity={16} distance={10} color="#67AAFF" />
      <FpsMeter />
    </>
  );
}
