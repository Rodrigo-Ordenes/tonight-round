"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useWorld } from "./WorldProvider";
import { edgeClamp, fitForAspect, projectBox, projectPoint, toolFrame, type ScreenPoint } from "./proyeccion";
import { dragLook, GYRO_KEY, releaseLook, stepLook, tiltLook } from "./mirar";

/*
 * El lienzo persistente de un apartado (se carga solo en el navegador). La cámara la mueve CameraControls entre los
 * puntos de vista con nombre (setLookAt con transición, ~700 ms); la persona no orbita ni hace zoom: lo único que
 * puede es MIRAR (girar la cabeza ±25° en el centro), que se suma encima en cada cuadro. En el mismo cuadro se proyecta
 * cada objeto a su botón real de la capa DOM y, al llegar, el marco de la herramienta. PerformanceMonitor baja o sube
 * el nivel según los cuadros que de verdad se logran (2: posproceso y más resolución; 1: la foto con relieve, sin
 * posproceso).
 */

/** Tiempo de suavizado de CameraControls: el viaje se asienta en ~0,7 s (medido en el laboratorio) */
const SMOOTH = 0.26;
/** Cuándo se considera llegada la cámara (m y rad): antes de que se note que sigue frenando */
const REST = 0.04;
const { NONE } = CameraControlsImpl.ACTION;

function Rig({ controls }: { controls: React.RefObject<CameraControlsImpl | null> }) {
  const world = useWorld()!;
  const { room, view, reduce, bus } = world;
  const { camera, size, gl } = useThree();
  const first = useRef(true);
  const token = useRef(0);
  const fovTarget = useRef<number | null>(null);
  const arrivedView = useRef<string | null>(null);
  const free = useRef(false);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const pt = useMemo<ScreenPoint>(() => ({ x: 0, y: 0, front: false, inside: false }), []);
  /** La última posición escrita en cada botón (por elemento: si un botón se vuelve a montar, se escribe de nuevo) */
  const placed = useMemo(() => new WeakMap<HTMLElement, string>(), []);
  const frame = useRef("");

  // ACERCARSE / VOLVER: viajar al punto de vista de la vista actual (ajustado a una pantalla vertical)
  useEffect(() => {
    const c = controls.current;
    if (!c || !view) return;
    const base = room.viewpoints[view] ?? room.viewpoints[room.home];
    if (!base) {
      bus.arrive(view);
      return;
    }
    const vp = fitForAspect(base, size.width / Math.max(1, size.height));
    const id = ++token.current;
    arrivedView.current = null;
    fovTarget.current = vp.fov;
    const [px, py, pz] = vp.position;
    const [tx, ty, tz] = vp.target;
    const done = () => {
      if (id !== token.current) return;
      arrivedView.current = view;
      bus.arrive(view);
    };
    const cam = camera as THREE.PerspectiveCamera;
    const snapFov = () => {
      cam.fov = vp.fov;
      cam.updateProjectionMatrix();
    };
    const el = gl.domElement;
    // La primera vez la cámara ya está ahí (sin viaje desde el origen)
    if (first.current) {
      first.current = false;
      snapFov();
      void c.setLookAt(px, py, pz, tx, ty, tz, false).then(done);
      return;
    }
    // Con movimiento reducido, un fundido en vez del viaje
    if (reduce) {
      el.style.transition = "opacity 120ms linear";
      el.style.opacity = "0";
      const t = window.setTimeout(() => {
        snapFov();
        void c.setLookAt(px, py, pz, tx, ty, tz, false).then(done);
        el.style.transition = "opacity 200ms linear";
        el.style.opacity = "1";
      }, 120);
      return () => window.clearTimeout(t);
    }
    el.style.opacity = "1";
    void c.setLookAt(px, py, pz, tx, ty, tz, true).then(done);
  }, [view, size.width, size.height, reduce, room, bus, camera, gl, controls]);

  // MIRAR: arrastre (en táctil solo de lado: lo vertical es el scroll de la página) y giroscopio si ya hay permiso
  useEffect(() => {
    const el = gl.domElement;
    let pointer: number | null = null;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      pointer = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      if (free.current) dragLook(bus.look, dx, e.pointerType === "mouse" ? dy : 0, size, (camera as THREE.PerspectiveCamera).fov);
    };
    const up = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      pointer = null;
      releaseLook(bus.look);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl, bus, size, camera]);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: coarse)").matches) return;
    const ask = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent?.requestPermission;
    let allowed = !ask;
    try {
      allowed = allowed || sessionStorage.getItem(GYRO_KEY) === "1";
    } catch {
      /* sin almacenamiento: solo Android y escritorio */
    }
    if (!allowed) return;
    const on = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null || !free.current || bus.look.held) return;
      tiltLook(bus.look, e.gamma, e.beta);
    };
    window.addEventListener("deviceorientation", on, { passive: true });
    return () => window.removeEventListener("deviceorientation", on);
  }, [reduce, bus]);

  // Cada cuadro, después de CameraControls (prioridad −1, que fija la pose): lente, MIRAR, botones y marco
  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const target = fovTarget.current;
    if (target !== null && Math.abs(cam.fov - target) > 0.01) {
      cam.fov = reduce ? target : THREE.MathUtils.damp(cam.fov, target, 6, dt);
      cam.updateProjectionMatrix();
    }
    const look = bus.look;
    free.current = view === room.home && arrivedView.current === view && !bus.tool.open;
    if (!free.current && !look.held) {
      look.tYaw = 0;
      look.tPitch = 0;
    }
    stepLook(look, dt, reduce);
    if (Math.abs(look.yaw) > 1e-5 || Math.abs(look.pitch) > 1e-5) {
      cam.rotateY(look.yaw);
      cam.rotateX(look.pitch);
    }
    cam.updateMatrixWorld();
    m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

    for (const a of room.anchors) {
      const el = bus.anchors.get(a.id);
      if (!el || el.dataset.modo !== "escena") continue;
      const c = edgeClamp(projectPoint(m.elements, a.at, size, pt), size, bus.insets);
      const tr = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0) translate(-50%,-50%)`;
      if (placed.get(el) !== tr || !el.style.transform) {
        el.style.transform = tr;
        placed.set(el, tr);
      }
      const edge = c.edge ? "1" : "0";
      if (el.dataset.borde !== edge) el.dataset.borde = edge;
      if (el.dataset.listo !== "1") el.dataset.listo = "1";
    }

    const tool = bus.tool;
    if (tool.open && tool.el) {
      const a = room.anchors.find((x) => x.id === tool.id);
      const rect = a ? projectBox(m.elements, a.at, a.size, size) : null;
      const f = toolFrame(rect, size, bus.insets);
      const ox = rect ? rect.x + rect.width / 2 - f.x : f.width / 2;
      const oy = rect ? rect.y + rect.height / 2 - f.y : f.height / 2;
      const key = `${f.x | 0},${f.y | 0},${f.width | 0},${f.height | 0},${ox | 0},${oy | 0}`;
      if (key !== frame.current) {
        frame.current = key;
        const s = tool.el.style;
        s.setProperty("--tool-x", `${f.x | 0}px`);
        s.setProperty("--tool-y", `${f.y | 0}px`);
        s.setProperty("--tool-w", `${f.width | 0}px`);
        s.setProperty("--tool-h", `${f.height | 0}px`);
        s.setProperty("--tool-ox", `${ox | 0}px`);
        s.setProperty("--tool-oy", `${oy | 0}px`);
      }
    } else frame.current = "";
  });

  return null;
}

/** Avisa una vez que la escena cargó (después de su primer cuadro) */
function Ready({ onReady }: { onReady: () => void }) {
  const world = useWorld();
  const bus = world?.bus;
  useEffect(() => {
    if (!bus) return;
    const raf = requestAnimationFrame(() => {
      bus.ready();
      onReady();
    });
    return () => cancelAnimationFrame(raf);
  }, [bus, onReady]);
  return null;
}

/** Los tirones de la carga (texturas, sombreadores) no cuentan: se mide el rendimiento 1,5 s después de estar lista */
const SETTLE_MS = 1500;

export default function WorldCanvas({ level, paused, Scene }: { level: 1 | 2; paused: boolean; Scene: React.ComponentType }) {
  const world = useWorld()!;
  const { bus, small } = world;
  const controls = useRef<CameraControlsImpl | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const settle = useRef(0);
  const onReady = useCallback(() => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setMeasuring(true), SETTLE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(settle.current), []);
  // CameraControls se conecta a un nodo suelto: así no pone touch-action: none ni captura la rueda sobre la página
  const detached = useMemo(() => (typeof document === "undefined" ? undefined : document.createElement("div")), []);
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={level === 2 ? [1, small ? 1.5 : 1.75] : 1}
      camera={{ fov: 50, near: 0.05, far: 80, position: [0, 1.6, 6] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor("#060609")}
    >
      {measuring && <PerformanceMonitor flipflops={3} onDecline={() => bus.perf("decline")} onIncline={() => bus.perf("incline")} onFallback={() => bus.perf("fallback")} />}
      <CameraControls
        ref={controls}
        domElement={detached}
        smoothTime={SMOOTH}
        restThreshold={REST}
        mouseButtons={{ left: NONE, middle: NONE, right: NONE, wheel: NONE }}
        touches={{ one: NONE, two: NONE, three: NONE }}
      />
      <Rig controls={controls} />
      <Suspense fallback={null}>
        <Scene />
        <Ready onReady={onReady} />
      </Suspense>
      {level === 2 && (
        <Suspense fallback={null}>
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom mipmapBlur intensity={small ? 0.8 : 1} luminanceThreshold={0.62} luminanceSmoothing={0.2} />
            <Vignette eskil={false} offset={0.22} darkness={0.6} />
          </EffectComposer>
        </Suspense>
      )}
    </Canvas>
  );
}
