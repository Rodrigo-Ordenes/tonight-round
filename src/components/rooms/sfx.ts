import { audioEffects } from "@/lib/audioEffects";

/*
 * Sonidos de la casa, sintetizados (sin archivos): el hielo que tintinea en la barra, la ficha que cae en el paño, el
 * rasguido del disco en la cabina y el soplo al cruzar a otra sala. Suaves y cortos; respetan el silencio general de
 * la app y, en el celular, acompañan con una vibración mínima (Android).
 */

// El mismo contexto de audio de toda la app (crear otro cuesta y congelaría la primera jugada)
const audio = () => (audioEffects.isMuted() ? null : audioEffects.shared());

/** Prepara el audio cuando la página está quieta, para que el primer sonido no frene nada */
export function warmAudio() {
  const go = () => audioEffects.warm();
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 2500 });
  else window.setTimeout(go, 1200);
}

const buzz = (ms: number | number[]) => {
  try {
    if (!audioEffects.isMuted()) navigator.vibrate?.(ms);
  } catch {
    /* sin vibración */
  }
};

function ping(c: AudioContext, t: number, freq: number, gain: number, dur: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(c: AudioContext, t: number, dur: number, type: BiquadFilterType, freq: number, gain: number, sweep?: number) {
  const len = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

export const sfx = {
  /** Hielo que choca en el vaso */
  clink() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    ping(c, t, 2350 + Math.random() * 300, 0.05, 0.16);
    ping(c, t + 0.045, 3100 + Math.random() * 400, 0.035, 0.12);
    buzz(8);
  },
  /** Ficha de casino que cae sobre el paño */
  chip() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.05, "bandpass", 3200, 0.08);
    noise(c, t + 0.06, 0.04, "bandpass", 2600, 0.05);
    buzz(10);
  },
  /** Rasguido de disco */
  scratch() {
    const c = audio();
    if (!c) return;
    noise(c, c.currentTime, 0.22, "bandpass", 600, 0.07, 2400);
    buzz([6, 30, 6]);
  },
  /** Carta que sale del zapato y se desliza por el paño */
  card() {
    const c = audio();
    if (!c) return;
    noise(c, c.currentTime, 0.11, "highpass", 2600, 0.05, 5200);
  },
  /** Varias fichas que se apilan (pago o apuesta) */
  chips(n = 4) {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < Math.min(8, n); i++) noise(c, c.currentTime + i * 0.055 + Math.random() * 0.02, 0.045, "bandpass", 2800 + Math.random() * 900, 0.06);
    buzz(14);
  },
  /** La bola rodando por la pista: rueda rápido y va frenando (dura `secs`); al final, los saltitos en los trastes */
  ball(secs = 6) {
    const c = audio();
    if (!c) return;
    const t0 = c.currentTime;
    const len = Math.floor(c.sampleRate * secs);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const k = i / len;
      // El ritmo del rodar: de 16 a 3 golpes por segundo, cada vez más suave
      const rate = 16 - 13 * k;
      phase += rate / c.sampleRate;
      const pulse = Math.pow(0.5 + 0.5 * Math.cos(phase * Math.PI * 2), 6);
      d[i] = (Math.random() * 2 - 1) * (0.25 + pulse * 0.75) * (1 - k * 0.6);
    }
    const s = c.createBufferSource();
    s.buffer = b;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1700;
    f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.2);
    g.gain.setValueAtTime(0.07, t0 + secs * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + secs);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t0);
    for (const [k, v] of [
      [0.86, 0.09],
      [0.91, 0.06],
      [0.95, 0.05],
      [0.985, 0.04],
    ] as const)
      noise(c, t0 + secs * k, 0.035, "bandpass", 3600, v);
  },
  /** Soplo de paso: cruzar de una sala a otra */
  whoosh() {
    const c = audio();
    if (!c) return;
    noise(c, c.currentTime, 0.42, "lowpass", 300, 0.06, 2600);
    buzz(12);
  },
};
