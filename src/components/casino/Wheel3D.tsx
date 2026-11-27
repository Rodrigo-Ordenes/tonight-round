"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { WHEEL_ORDER, rouletteColor } from "@/lib/casinoGames";
import { WHEEL_SPIN_MS } from "./tiempos";

/*
 * La ruleta en 3D (three.js): tazón de madera con filo de oro, pista de la bola con sus rombos, el cilindro con los 37
 * bolsillos (morado, negro y el cero verde) separados por trastes de oro, el cono y la torreta cromada, y una bola de
 * marfil. Al girar, el cilindro va hacia un lado y la bola hacia el otro, rodando por la pista; va perdiendo velocidad,
 * baja en espiral, salta en los trastes y cae en el bolsillo del número (el mismo que decide la lógica). Reflejos de
 * un ambiente armado con luces propias (nada se baja de afuera: la CSP no lo permite).
 */

const N = WHEEL_ORDER.length;
const STEP = (Math.PI * 2) / N;
const R_POCKET = 0.72;
const R_TRACK = 1.02;
const POCKET_HEX: Record<string, string> = { verde: "#0E6B43", morado: "#6A1E92", negro: "#121217" };

const easeOut = (t: number, p = 3) => 1 - Math.pow(1 - t, p);

/** El anillo de números: un dibujo polar en un canvas, mapeado sobre un anillo plano (UV planas) */
function useNumberRing() {
  return useMemo(() => {
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const cx = S / 2;
    const rOut = S / 2;
    const rIn = S * 0.32;
    for (let i = 0; i < N; i++) {
      const n = WHEEL_ORDER[i];
      // El anillo acostado mapea la x del canvas a la x del mundo y la y del canvas (hacia abajo) a la z del mundo: el
      // bolsillo i del cilindro (dirección sin, cos de i·paso) cae en el ángulo de canvas π/2 − i·paso
      const a0 = Math.PI / 2 - i * STEP - STEP / 2;
      const a1 = a0 + STEP;
      g.beginPath();
      g.arc(cx, cx, rOut, a0, a1);
      g.arc(cx, cx, rIn, a1, a0, true);
      g.closePath();
      g.fillStyle = POCKET_HEX[rouletteColor(n)];
      g.fill();
      g.strokeStyle = "rgba(212,175,55,0.9)";
      g.lineWidth = 3;
      g.stroke();
      const mid = (a0 + a1) / 2;
      g.save();
      g.translate(cx + Math.cos(mid) * rOut * 0.86, cx + Math.sin(mid) * rOut * 0.86);
      g.rotate(mid + Math.PI / 2);
      g.fillStyle = "#F7F3E8";
      g.font = "900 34px ui-monospace, Menlo, monospace";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(n), 0, 0);
      g.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
}

type Spin = { id: number; n: number } | null;

function Wheel({ spin, onLand }: { spin: Spin; onLand?: () => void }) {
  const cylinder = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const ring = useNumberRing();
  // Estado de la animación (en radianes, en el sentido de giro de three: positivo = antihorario visto desde arriba)
  const anim = useRef({ t0: 0, wheelFrom: 0, wheelTo: 0, ballFrom: 0, ballTo: 0, running: false, landed: false, idleSpin: 0.12, ballRel: 0 });
  const landed = useRef(onLand);
  landed.current = onLand;

  useEffect(() => {
    if (!spin) return;
    const a = anim.current;
    const wheelNow = cylinder.current?.rotation.y ?? 0;
    // El cilindro gira unas cuatro vueltas (sentido horario) y frena; la bola, al revés, unas nueve vueltas
    const wheelTo = wheelNow - Math.PI * 2 * 4.3;
    const pocketAngle = WHEEL_ORDER.indexOf(spin.n) * STEP;
    // Ángulo final de la bola en el mundo = ángulo del cilindro + el del bolsillo (para que quede dentro de él)
    const ballFinal = wheelTo + pocketAngle;
    const ballNow = a.landed ? wheelNow + a.ballRel : a.ballFrom;
    let ballTo = ballFinal;
    while (ballTo < ballNow + Math.PI * 2 * 9) ballTo += Math.PI * 2;
    Object.assign(a, { t0: performance.now(), wheelFrom: wheelNow, wheelTo, ballFrom: ballNow, ballTo, running: true, landed: false, ballRel: pocketAngle });
  }, [spin]);

  useFrame((state, dt) => {
    const a = anim.current;
    const cyl = cylinder.current;
    const b = ball.current;
    if (!cyl || !b) return;
    let ballAngle: number;
    let radius = R_TRACK;
    let lift = 0.115;
    if (a.running) {
      const k = Math.min(1, (performance.now() - a.t0) / WHEEL_SPIN_MS);
      cyl.rotation.y = a.wheelFrom + (a.wheelTo - a.wheelFrom) * easeOut(k, 3);
      ballAngle = a.ballFrom + (a.ballTo - a.ballFrom) * easeOut(k, 4);
      // Del 62 % al 86 % del tiempo baja en espiral hasta el anillo de los bolsillos; al final, saltitos en los trastes
      const drop = THREE.MathUtils.smoothstep(k, 0.62, 0.86);
      radius = R_TRACK + (R_POCKET + 0.03 - R_TRACK) * drop;
      lift = 0.115 - drop * 0.07 + (k > 0.84 && k < 0.97 ? Math.abs(Math.sin(k * 110)) * 0.03 * (1 - k) * 6 : 0);
      if (k >= 1) {
        a.running = false;
        a.landed = true;
        landed.current?.();
      }
    } else {
      // Quieta: el cilindro sigue girando lento (como en el casino) y, si ya cayó, la bola va con él
      cyl.rotation.y -= a.idleSpin * dt;
      ballAngle = a.landed ? cyl.rotation.y + a.ballRel : a.ballFrom;
      if (a.landed) {
        radius = R_POCKET + 0.03;
        lift = 0.045;
      }
    }
    b.position.set(Math.sin(ballAngle) * radius, lift, Math.cos(ballAngle) * radius);
    state.camera.lookAt(0, 0, 0);
  });

  // El perfil del tazón (torneado): borde exterior, pista inclinada y el hueco del cilindro
  const bowl = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [1.36, -0.12],
          [1.36, 0.1],
          [1.3, 0.16],
          [1.18, 0.14],
          [R_TRACK + 0.08, 0.12],
          [R_TRACK - 0.06, 0.06],
          [0.9, 0.0],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        96,
      ),
    [],
  );
  const cone = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.5, 0.0],
          [0.42, 0.06],
          [0.22, 0.12],
          [0.1, 0.15],
          [0.0, 0.16],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        64,
      ),
    [],
  );

  return (
    <group>
      {/* Tazón de madera y su filo de oro */}
      <mesh geometry={bowl} castShadow receiveShadow>
        <meshStandardMaterial color="#5B3A1E" roughness={0.42} metalness={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <torusGeometry args={[1.31, 0.018, 12, 128]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.22} />
      </mesh>
      {/* Rombos de la pista */}
      {Array.from({ length: 8 }, (_, k) => (
        <mesh key={k} position={[Math.sin((k / 8) * Math.PI * 2) * 1.12, 0.14, Math.cos((k / 8) * Math.PI * 2) * 1.12]} rotation={[0, (k / 8) * Math.PI * 2, Math.PI / 4]}>
          <boxGeometry args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial color="#E9EEF7" metalness={1} roughness={0.15} />
        </mesh>
      ))}
      {/* El cilindro que gira */}
      <group ref={cylinder}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5, 0.9, 128, 1]} />
          <meshStandardMaterial map={ring} roughness={0.35} metalness={0.05} />
        </mesh>
        {/* Trastes de oro entre bolsillos */}
        {Array.from({ length: N }, (_, i) => {
          const a = (i + 0.5) * STEP;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.71, 0.055, Math.cos(a) * 0.71]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.008, 0.045, 0.18]} />
              <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.25} />
            </mesh>
          );
        })}
        <mesh geometry={cone} position={[0, 0.03, 0]}>
          <meshStandardMaterial color="#6B4528" roughness={0.38} metalness={0.2} />
        </mesh>
        {/* Torreta cromada con sus cuatro brazos */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.2, 24]} />
          <meshStandardMaterial color="#E9EEF7" metalness={1} roughness={0.12} />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            <mesh position={[0, 0.3, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.24, 12]} />
              <meshStandardMaterial color="#E9EEF7" metalness={1} roughness={0.12} />
            </mesh>
            <mesh position={[0, 0.3, 0.26]}>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
      {/* La bola de marfil */}
      <mesh ref={ball} castShadow position={[0, 0.115, R_TRACK]}>
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial color="#FBF8F1" roughness={0.18} metalness={0} />
      </mesh>
    </group>
  );
}

/** El lienzo de la ruleta: cámara de mesa (como la de un casino en vivo), lámpara cálida y brillo en el oro */
export default function Wheel3D({ spin, onLand, small = false }: { spin: Spin; onLand?: () => void; small?: boolean }) {
  return (
    <Canvas
      dpr={[1, small ? 1.5 : 1.8]}
      shadows
      camera={{ fov: 34, near: 0.05, far: 20, position: [0, 2.45, 2.55] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.35} />
      <spotLight position={[0.6, 4.2, 1.2]} angle={0.55} penumbra={0.7} intensity={60} color="#FFE7B0" castShadow />
      <pointLight position={[-2, 1.4, -1]} intensity={4} color="#B93EF3" />
      {/* Ambiente de reflejos hecho con luces propias (sin descargar nada) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="ring" intensity={3} color="#FFE7B0" position={[0, 4, 0]} scale={3} />
        <Lightformer intensity={1.4} color="#ECC85F" position={[3, 1, 2]} scale={[2, 1, 1]} />
        <Lightformer intensity={0.8} color="#67AAFF" position={[-3, 1, -2]} scale={[2, 1, 1]} />
      </Environment>
      <Wheel spin={spin} onLand={onLand} />
      {/* Solo la sombra sobre el paño de la página: el lienzo es transparente y la rueda queda posada en la mesa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[2.2, 64]} />
        <shadowMaterial opacity={0.45} />
      </mesh>
    </Canvas>
  );
}
