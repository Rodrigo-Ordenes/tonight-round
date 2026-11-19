"use client";

/**
 * «Receipt Printer» de 21st.dev (Aakash Mehra) adaptada a Tonight sin motion/react: una impresora térmica vista desde
 * arriba. IMPRIMIR hace salir la boleta de la ranura con la misma curva de alimentación del original
 * (cubic-bezier(0.4, 0, 0.9, 1), 0,9 s + 0,1 s por línea) y el zumbido del motor; apretar a mitad la detiene y
 * volver a apretar une otra boleta a la tira. Tirar la tira la estira con resistencia (×0,3), se corta a los 80 px
 * por el borde dentado y sale volando (850 ms, cubic-bezier(0.2, 0.7, 0.3, 1)); si se suelta antes, vuelve con un
 * resorte (rigidez 500, amortiguación 22). Sonidos sintetizados con WebAudio, apagados con el silencio de Tonight.
 * Los montos se imprimen fijos: lo que se mueve es el papel, nunca las cifras.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { audioEffects } from "@/lib/audioEffects";

export type ReceiptRow = { left: string; right?: string; strong?: boolean };

export interface ReceiptPrinterProps {
  title: string;
  subtitle?: string;
  rows: ReceiptRow[];
  footer?: string;
  onPrint?: () => void;
  className?: string;
}

type Receipt = { id: number; frac: number; date: string };

const BEZIER = (p1x: number, p1y: number, p2x: number, p2y: number) => {
  // Curva cúbica de CSS resuelta por bisección (x → y), igual que el navegador
  const cx = 3 * p1x,
    bx = 3 * (p2x - p1x) - cx,
    ax = 1 - cx - bx;
  const cy = 3 * p1y,
    by = 3 * (p2y - p1y) - cy,
    ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let lo = 0,
      hi = 1,
      t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (sx(t) < x) lo = t;
      else hi = t;
    }
    return sy(t);
  };
};
const feedEase = BEZIER(0.4, 0, 0.9, 1);

export default function ReceiptPrinter({
  title,
  subtitle,
  rows,
  footer = "¡GRACIAS POR EL CARRETE!",
  onPrint,
  className = "",
}: ReceiptPrinterProps) {
  const [strip, setStrip] = useState<Receipt[]>([]);
  const [flying, setFlying] = useState<null | {
    strip: Receipt[];
    x: number;
    y: number;
    vx: number;
    vy: number;
  }>(null);
  const [phase, setPhase] = useState<"idle" | "printing" | "stopped">("idle");
  const [pressed, setPressed] = useState(false);
  const nextId = useRef(0);
  const feed = useRef<{ raf: number; stopSound: () => void } | null>(null);
  const pullRef = useRef<HTMLDivElement | null>(null);
  const pull = useRef({ x: 0, y: 0, raf: 0 });
  const drag = useRef<null | {
    x0: number;
    y0: number;
    lx: number;
    ly: number;
    lt: number;
    vx: number;
    vy: number;
  }>(null);
  const lines = 12 + rows.length;

  const setPull = (x: number, y: number) => {
    pull.current.x = x;
    pull.current.y = y;
    if (pullRef.current)
      pullRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.04}deg)`;
  };

  useEffect(
    () => () => {
      if (feed.current) cancelAnimationFrame(feed.current.raf);
      feed.current?.stopSound();
      cancelAnimationFrame(pull.current.raf);
    },
    [],
  );

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const printOne = useCallback(() => {
    const r: Receipt = {
      id: nextId.current++,
      frac: 0,
      date: new Date().toLocaleString("es-CL", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setStrip((s) => [...s, r]);
    setPhase("printing");
    onPrint?.();
    const dur = (0.9 + lines * 0.1) * 1000;
    const stopSound = sfx.feed(dur / 1000);
    if (reduced()) {
      r.frac = 1;
      stopSound();
      setStrip((s) => [...s]);
      setPhase("stopped");
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      r.frac = feedEase(p);
      setStrip((s) => [...s]);
      if (p < 1) feed.current = { raf: requestAnimationFrame(step), stopSound };
      else {
        feed.current = null;
        setPhase("stopped");
        sfx.done();
      }
    };
    feed.current = { raf: requestAnimationFrame(step), stopSound };
  }, [lines, onPrint]);

  const stopFeed = () => {
    if (feed.current) {
      cancelAnimationFrame(feed.current.raf);
      feed.current.stopSound();
    }
    feed.current = null;
    setPhase("stopped");
  };

  const tear = (vx: number, vy: number) => {
    if (!strip.length) return;
    stopFeed();
    sfx.rip();
    setFlying({ strip, x: pull.current.x, y: pull.current.y, vx, vy });
    setStrip([]);
    setPhase("idle");
    setPull(0, 0);
  };

  const print = () => {
    sfx.unlock();
    sfx.button();
    setPressed(true);
    window.setTimeout(() => setPressed(false), 140);
    if (phase === "printing") stopFeed();
    else window.setTimeout(printOne, 160);
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    sfx.unlock();
    cancelAnimationFrame(pull.current.raf);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      x0: e.clientX,
      y0: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      lt: e.timeStamp,
      vx: 0,
      vy: 0,
    };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.vx = ((e.clientX - d.lx) / dt) * 1000;
    d.vy = ((e.clientY - d.ly) / dt) * 1000;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = e.timeStamp;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    // Se estira con resistencia; empujarla hacia la impresora no hace nada
    setPull(dx * 0.3, Math.min(0, dy) * 0.3);
    if (Math.hypot(dx, Math.min(0, dy)) > 80) {
      drag.current = null;
      tear(d.vx || dx * 8, Math.min(d.vy, -300));
    }
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    // Vuelve con un resorte (rigidez 500, amortiguación 22), como el original
    let x = pull.current.x,
      y = pull.current.y,
      vx = 0,
      vy = 0,
      last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      vx += (-500 * x - 22 * vx) * dt;
      vy += (-500 * y - 22 * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      setPull(x, y);
      if (Math.abs(x) + Math.abs(y) > 0.2 || Math.abs(vx) + Math.abs(vy) > 1)
        pull.current.raf = requestAnimationFrame(step);
      else setPull(0, 0);
    };
    pull.current.raf = requestAnimationFrame(step);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tear(0, -900);
    }
  };

  const hint =
    phase === "printing"
      ? "Imprimiendo… aprieta IMPRIMIR para detener"
      : strip.length
        ? "Tira la boleta para cortarla, o imprime otra"
        : "Aprieta IMPRIMIR";

  return (
    <div
      className={`receipt-printer relative mx-auto w-full max-w-[340px] select-none ${className}`}
    >
      {/* La tira sale de la ranura: se recorta en la ranura para que nazca desde adentro */}
      <div className="relative z-10 mx-auto h-[360px] w-[260px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {strip.length > 0 && (
            <div
              ref={pullRef}
              role="button"
              tabIndex={0}
              aria-label="Boleta. Tírala, o aprieta Enter, para cortarla."
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={onKey}
              className="pointer-events-auto absolute inset-x-[10px] bottom-0 cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:cursor-grabbing"
              style={{ transformOrigin: "50% 100%" }}
            >
              <Strip
                strip={strip}
                title={title}
                subtitle={subtitle}
                rows={rows}
                footer={footer}
              />
            </div>
          )}
        </div>
        {flying && (
          <FlyingStrip flying={flying} onDone={() => setFlying(null)}>
            <Strip
              strip={flying.strip}
              title={title}
              subtitle={subtitle}
              rows={rows}
              footer={footer}
            />
          </FlyingStrip>
        )}
      </div>

      {/* La impresora, desde arriba */}
      <div className="relative z-0 -mt-2 h-[150px] rounded-[28px] border border-white/10 bg-gradient-to-b from-night-800 to-night-900 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* ranura */}
        <div className="absolute left-1/2 top-0 h-3 w-[268px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-black to-night-950 shadow-[inset_0_2px_3px_rgba(0,0,0,0.9)]" />
        {/* barra dentada sobre la ranura */}
        <div className="receipt-teeth absolute left-1/2 top-0 z-20 h-[6px] w-[276px] -translate-x-1/2 -translate-y-[11px] bg-gradient-to-b from-slate-200 to-slate-500" />
        {/* luz de estado */}
        <span
          className={`absolute left-6 top-12 block h-2.5 w-2.5 rounded-full ${phase === "printing" ? "receipt-led-busy" : "bg-emerald-300 shadow-[0_0_8px_rgba(140,227,190,0.8)]"}`}
          aria-hidden
        />
        <span className="absolute left-6 top-[70px] font-led text-sm tracking-[0.2em] text-slate-500">
          TONIGHT
        </span>
        {/* botón IMPRIMIR */}
        <button
          type="button"
          onClick={print}
          aria-label={
            phase === "printing" ? "Detener la impresión" : "Imprimir la boleta"
          }
          className="absolute right-6 top-8 grid h-[76px] w-[76px] place-items-center rounded-full bg-night-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)] outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
        >
          <span
            className="grid h-[62px] w-[62px] place-items-center rounded-full text-[11px] font-black tracking-[0.12em] text-white transition-[transform] duration-100"
            style={{
              background:
                "radial-gradient(circle at 38% 30%, #E0A4FF 0%, #B93EF3 40%, #7E1FB0 80%)",
              boxShadow: pressed
                ? "inset 0 3px 6px rgba(40,0,60,0.6)"
                : "inset 0 -3px 5px rgba(40,0,60,0.5), 0 0 22px -4px rgba(185,62,243,0.8)",
              transform: pressed ? "translateY(2px) scale(0.96)" : "none",
            }}
          >
            IMPRIMIR
          </span>
        </button>
      </div>
      <p
        key={hint}
        aria-live="polite"
        className="receipt-hint mt-3 text-center text-xs text-slate-400"
      >
        {hint}
      </p>
    </div>
  );
}

function FlyingStrip({
  flying,
  onDone,
  children,
}: {
  flying: { x: number; y: number; vx: number; vy: number };
  onDone: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rot0 = flying.x * 0.04;
    el.style.transform = `translate(${flying.x}px, ${flying.y}px) rotate(${rot0}deg)`;
    el.style.opacity = "1";
    const id = requestAnimationFrame(() => {
      el.style.transition =
        "transform 850ms cubic-bezier(0.2, 0.7, 0.3, 1), opacity 850ms ease-in";
      el.style.transform = `translate(${flying.x + flying.vx * 0.55}px, ${flying.y + flying.vy * 0.55 - 120}px) rotate(${rot0 + flying.vx * 0.03 + (flying.vx >= 0 ? 14 : -14)}deg)`;
      el.style.opacity = "0";
    });
    const t = window.setTimeout(onDone, 900);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [flying, onDone]);
  return (
    <div
      ref={ref}
      className="receipt-torn pointer-events-none absolute inset-x-[10px] bottom-0 z-30"
      style={{ transformOrigin: "50% 100%" }}
    >
      {children}
    </div>
  );
}

function Strip({
  strip,
  title,
  subtitle,
  rows,
  footer,
}: {
  strip: Receipt[];
  title: string;
  subtitle?: string;
  rows: ReceiptRow[];
  footer: string;
}) {
  return (
    <div className="shadow-[0_10px_24px_-6px_rgba(0,0,0,0.6)]">
      {strip.map((r, i) => (
        <Segment key={r.id} frac={r.frac}>
          <Paper
            first={i === 0}
            date={r.date}
            order={r.id + 1}
            title={title}
            subtitle={subtitle}
            rows={rows}
            footer={footer}
          />
        </Segment>
      ))}
    </div>
  );
}

/** Solo existe lo ya impreso: al crecer, todo lo de arriba sube desde la ranura */
function Segment({
  frac,
  children,
}: {
  frac: number;
  children: React.ReactNode;
}) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState(0);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    setFull(el.offsetHeight);
    const ro = new ResizeObserver(() => setFull(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="relative overflow-hidden" style={{ height: frac * full }}>
      <div ref={inner}>{children}</div>
    </div>
  );
}

function Paper({
  first,
  date,
  order,
  title,
  subtitle,
  rows,
  footer,
}: {
  first: boolean;
  date: string;
  order: number;
  title: string;
  subtitle?: string;
  rows: ReceiptRow[];
  footer: string;
}) {
  const bars = Array.from(
    { length: 40 },
    (_, i) => ((order * (i + 7) * 31 + i * i) % 3) + 1,
  );
  return (
    <div className="relative bg-[linear-gradient(90deg,#f1f0eb_0%,#fdfdfa_6%,#fdfdfa_94%,#eeede8_100%)] px-5 pb-7 pt-5 font-mono text-[11.5px] leading-[1.55] text-[#262624]">
      <div style={{ opacity: 0.9 }}>
        <p className="text-center text-[15px] font-bold uppercase tracking-[0.08em]">
          {title}
        </p>
        {subtitle && <p className="text-center text-[10.5px]">{subtitle}</p>}
        <Rule />
        <Row left={`Boleta #${String(order).padStart(4, "0")}`} />
        <Row left={date} />
        <Rule />
        {rows.map((r, i) =>
          r.left === "—" ? (
            <Rule key={i} />
          ) : (
            <Row key={i} left={r.left} right={r.right} strong={r.strong} />
          ),
        )}
        <Rule />
        <div className="mt-1.5 flex h-10 items-stretch justify-center gap-[1.5px]">
          {bars.map((w, i) => (
            <span
              key={i}
              className="bg-[#262624]"
              style={{ width: w * 1.3, opacity: i % 5 === 0 ? 0.85 : 1 }}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] font-bold tracking-[0.18em]">
          {footer}
        </p>
      </div>
      {first && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/[0.07] to-transparent" />
      )}
    </div>
  );
}

const Rule = () => (
  <div className="my-2 border-t border-dashed border-[#2a2a2a]/50" />
);
const Row = ({ left, right, strong }: ReceiptRow) => (
  <div
    className={`flex justify-between gap-3 ${strong ? "text-[13px] font-bold" : ""}`}
  >
    <span className="truncate">{left}</span>
    {right !== undefined && (
      <span className="shrink-0 tabular-nums">{right}</span>
    )}
  </div>
);

/* ---------------- Sonido (WebAudio, se crea al primer toque; respeta el silencio de Tonight) ---------------- */

let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new AudioContext());
const quiet = () => audioEffects.isMuted();

function tone(
  freq: number,
  dur: number,
  o: { type?: OscillatorType; gain?: number; at?: number; to?: number } = {},
) {
  if (quiet()) return;
  const c = ac();
  const t = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.15, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(
  dur: number,
  o: {
    at?: number;
    gain?: number;
    freq?: number;
    type?: BiquadFilterType;
  } = {},
) {
  if (quiet()) return;
  const c = ac();
  const t = c.currentTime + (o.at ?? 0);
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = o.type ?? "lowpass";
  f.frequency.value = o.freq ?? 800;
  const g = c.createGain();
  g.gain.setValueAtTime(o.gain ?? 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

const sfx = {
  unlock: () => {
    if (!quiet()) void ac().resume();
  },
  button: () => {
    noise(0.02, { freq: 1300, type: "bandpass", gain: 0.6 });
    tone(230, 0.05, { gain: 0.08, to: 160 });
  },
  /** Motor de alimentación: sierra filtrada, cortada como un paso a paso, con un poco de siseo de papel */
  feed: (dur: number) => {
    if (quiet()) return () => {};
    const c = ac();
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.06, t + 0.06);
    out.gain.setValueAtTime(0.06, t + Math.max(0.07, dur - 0.1));
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(c.destination);
    const chop = c.createGain();
    chop.gain.value = 0.58;
    const lfo = c.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 34;
    const depth = c.createGain();
    depth.gain.value = 0.42;
    lfo.connect(depth).connect(chop.gain);
    chop.connect(out);
    const motor = c.createOscillator();
    motor.type = "sawtooth";
    motor.frequency.setValueAtTime(290, t);
    motor.frequency.linearRampToValueAtTime(320, t + dur);
    const body = c.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 1300;
    body.Q.value = 1.4;
    motor.connect(body).connect(chop);
    for (const n of [lfo, motor]) {
      n.start(t);
      n.stop(t + dur + 0.05);
    }
    return () => {
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    };
  },
  done: () => {
    tone(1568, 0.09, { gain: 0.03 });
    tone(2093, 0.14, { at: 0.08, gain: 0.025 });
  },
  rip: () => {
    for (let i = 0; i < 12; i++)
      noise(0.018 + Math.random() * 0.02, {
        at: i * 0.02 + Math.random() * 0.01,
        freq: 2200 + Math.random() * 3000,
        type: "highpass",
        gain: 0.25 + Math.random() * 0.3,
      });
  },
};
