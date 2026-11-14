"use client";

import { useEffect, useRef } from "react";
import { HUB, MAX_NODES, assignSlots, burstTargets, layoutField, nodeDrift, pulseProgress, shotProgress, unseenEvents } from "@/lib/signalField";
import type { RoomEvent, RoomEventKind } from "@/lib/roomEvents";

const PERIOD_MS = 5200;
const MAX_DPR = 2;
const FRAME_MS = 1000 / 40;
const SHOT_MS = 760;
const RING_MS = 320;
const JOIN_MS = 800;
const SHOT_GAP_MS = 45;
const EVENT_GAP_MS = 110;
const MAX_SHOTS = 48;

export interface FieldPerson {
  id: string;
  name: string;
}

interface Shot {
  node: number;
  start: number;
  kind?: RoomEventKind;
}

// Color de la señal según lo que pasó: trago, agua, voto, canción, brindis
const KIND_VAR: Record<RoomEventKind, string> = { drink: "--violet", water: "--signal", vote: "--blue", song: "--amber", cheers: "--violet-text" };

/**
 * Red viva: cada celular conectado a la pantalla de la sala, con señales que viajan por los enlaces.
 * - Modo ambiente (`count`): decorativa, para la portada. `burst` es un contador: cada vez que sube, un celular manda
 *   una señal (al escribir el código, al crear la sala).
 * - Modo personas (`people` y `events`): la TV. Cada punto es alguien de la sala con su nombre y un lugar fijo; quien
 *   llega entra con un anillo y cada evento real (trago, agua, voto, canción, brindis) viaja una sola vez desde su
 *   celular. Lo que ya había al abrir la TV no se repite.
 * No recibe foco ni toques, se detiene fuera de pantalla y con movimiento reducido queda fija.
 */
export default function SignalField({
  count = 0,
  seed = 7,
  burst = 0,
  people,
  events,
  labels = true,
  className = "",
}: {
  count?: number;
  seed?: number;
  burst?: number;
  people?: FieldPerson[];
  events?: RoomEvent[];
  /** Nombres junto a cada punto (la TV); en el celular la red va detrás de las cifras y sin nombres */
  labels?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const shots = useRef<Shot[]>([]);
  const lastBurst = useRef(burst);
  const peopleMode = people !== undefined;
  const slots = useRef(new Map<string, number>());
  const names = useRef(new Map<number, string>());
  const bornAt = useRef(new Map<number, number>());
  const seen = useRef<Set<string> | null>(null);
  // Con movimiento reducido la red no se anima: se redibuja cuando cambia quién está
  const redraw = useRef<(() => void) | null>(null);

  useEffect(() => {
    const prev = lastBurst.current;
    lastBurst.current = burst;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = performance.now();
    burstTargets(prev, burst, Math.min(count, MAX_NODES)).forEach((node, i) => shots.current.push({ node, start: now + i * SHOT_GAP_MS }));
    if (shots.current.length > MAX_SHOTS) shots.current = shots.current.slice(-MAX_SHOTS);
  }, [burst, count]);

  // Personas: lugares estables y anillo de entrada para quien llega después de abrir la TV
  useEffect(() => {
    if (!people) return;
    const first = slots.current.size === 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = performance.now();
    const next = assignSlots(slots.current, people.map((p) => p.id), MAX_NODES);
    for (const [id, slot] of next) if (slots.current.get(id) !== slot) bornAt.current.set(slot, first || still ? -1e9 : now);
    slots.current = next;
    names.current = new Map(people.filter((p) => next.has(p.id)).map((p) => [next.get(p.id)!, p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name]));
    redraw.current?.();
  }, [people]);

  // Eventos: cada uno nuevo viaja una vez desde el celular de esa persona
  useEffect(() => {
    if (!events) return;
    if (seen.current === null) {
      seen.current = new Set(events.map((e) => e.key));
      return;
    }
    const fresh = unseenEvents(seen.current, events);
    if (!fresh.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = performance.now();
    fresh.forEach((e, i) => {
      seen.current!.add(e.key);
      const node = slots.current.get(e.participantId);
      if (node !== undefined && !reduced) shots.current.push({ node, start: now + i * EVENT_GAP_MS, kind: e.kind });
    });
    if (shots.current.length > MAX_SHOTS) shots.current = shots.current.slice(-MAX_SHOTS);
  }, [events]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const violet = styles.getPropertyValue("--violet").trim();
    const blue = styles.getPropertyValue("--blue").trim();
    const kindColor = Object.fromEntries(Object.entries(KIND_VAR).map(([k, v]) => [k, styles.getPropertyValue(v).trim()])) as Record<RoomEventKind, string>;
    const font = getComputedStyle(document.body).fontFamily;
    const all = layoutField(peopleMode ? MAX_NODES : count, seed);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const segment = (x: number, y: number, hx: number, hy: number, p: number, color: string, lineWidth: number) => {
      const tail = Math.max(0, p - 0.12);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x + (hx - x) * tail, y + (hy - y) * tail);
      ctx.lineTo(x + (hx - x) * p, y + (hy - y) * p);
      ctx.stroke();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const hub = { x: HUB.x * width, y: HUB.y * height };
      // Nodos visibles: todos en modo ambiente; en modo personas, solo los lugares ocupados
      const visible = peopleMode ? [...names.current.keys()] : all.map((_, i) => i);
      const points = new Map<number, { x: number; y: number }>();
      for (const i of visible) {
        const n = all[i];
        if (!n) continue;
        const d = nodeDrift(i, t);
        points.set(i, { x: (n.x + d.x) * width, y: (n.y + d.y) * height });
      }
      const lit = new Map<number, string>();
      let ring = 0;
      let ringColor = violet;

      shots.current = shots.current.filter((s) => t <= s.start + SHOT_MS + RING_MS);
      for (const s of shots.current) {
        const pt = points.get(s.node);
        if (!pt) continue;
        const color = s.kind ? kindColor[s.kind] : violet;
        const p = shotProgress(s.start, t, SHOT_MS);
        if (p !== null) {
          segment(pt.x, pt.y, hub.x, hub.y, p, color, s.kind === "cheers" ? 3.5 : 2.4);
          lit.set(s.node, color);
        } else if (t > s.start + SHOT_MS) {
          const k = 1 - (t - s.start - SHOT_MS) / RING_MS;
          if (k > ring) {
            ring = k;
            ringColor = color;
          }
        }
      }

      const labelSize = Math.round(Math.min(22, Math.max(12, width / 80)));
      ctx.font = `600 ${labelSize}px ${font}`;
      ctx.textBaseline = "middle";

      for (const [i, pt] of points) {
        ctx.strokeStyle = "rgba(236, 236, 241, 0.09)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(hub.x, hub.y);
        ctx.stroke();

        // Pulso de ambiente: más tenue en la TV para que se distingan los eventos reales
        const p = pulseProgress(all[i].phase, t, PERIOD_MS);
        if (p !== null) {
          ctx.globalAlpha = peopleMode ? 0.35 : 1;
          segment(pt.x, pt.y, hub.x, hub.y, p, i % 3 === 0 ? violet : blue, 1.5);
          ctx.globalAlpha = 1;
        }

        // Entrada: el punto crece y suelta un anillo
        const born = bornAt.current.get(i) ?? -1e9;
        const join = Math.min(1, Math.max(0, (t - born) / JOIN_MS));
        const grow = 1 - (1 - join) ** 3;
        const color = lit.get(i);
        const r = (peopleMode ? 4 : 2) * (0.4 + 0.6 * grow) + (color ? 1.5 : 0);
        if (join < 1) {
          ctx.strokeStyle = violet;
          ctx.globalAlpha = 1 - join;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6 + 26 * grow, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = color ?? (peopleMode ? "rgba(236, 236, 241, 0.85)" : p !== null ? "rgba(236, 236, 241, 0.75)" : "rgba(236, 236, 241, 0.3)");
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Nombre junto a su celular (hacia afuera, para no taparse con la pantalla)
        const name = peopleMode && labels ? names.current.get(i) : undefined;
        if (name) {
          const right = pt.x < hub.x;
          ctx.textAlign = right ? "right" : "left";
          ctx.fillStyle = `rgba(236, 236, 241, ${0.85 * grow})`;
          ctx.fillText(name, pt.x + (right ? -12 : 12), pt.y);
        }
      }

      // Pantalla de la sala
      if (ring > 0) {
        ctx.strokeStyle = ringColor;
        ctx.globalAlpha = ring * 0.7;
        ctx.lineWidth = 1.5;
        const grow = (1 - ring) * 10;
        ctx.strokeRect(hub.x - 15 - grow, hub.y - 9 - grow, 30 + grow * 2, 18 + grow * 2);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = "rgba(236, 236, 241, 0.4)";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(hub.x - 15, hub.y - 9, 30, 18);
      ctx.fillStyle = violet;
      ctx.fillRect(hub.x - 2, hub.y - 2, 4, 4);
    };

    resize();
    let raf = 0;
    let last = 0;
    let visible = true;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      draw(t);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches || !visible || document.hidden) {
        shots.current = [];
        draw(PERIOD_MS * 0.2);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    redraw.current = () => {
      if (reduced.matches || !visible || document.hidden) draw(PERIOD_MS * 0.2);
    };
    const onResize = new ResizeObserver(() => {
      resize();
      sync();
    });
    onResize.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();

    return () => {
      redraw.current = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      onResize.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [count, seed, peopleMode, labels]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute -z-10 ${className}`} />;
}
