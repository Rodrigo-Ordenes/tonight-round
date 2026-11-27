/*
 * El sonido del club, sintetizado en el navegador con Web Audio (sin archivos ni licencias): un house suave a 118 BPM
 * —bombo, palmas, platillos, bajo y acordes— que afuera se oye ahogado tras la puerta (un filtro pasa bajos) y se abre
 * al entrar; en la cabina del DJ suena más fuerte. Solo suena si la persona lo enciende (los navegadores no dejan
 * sonar sin un toque) y se calla cuando la sala sale de la vista. Aunque esté en silencio, marca el pulso (beat) con
 * el que laten las luces y el neón.
 */

import { ZONAS_CLUB } from "./zonas";

const BPM = 118;
const SPB = 60 / BPM;
const STEP = SPB / 4;
// Am – F – C – G: raíces del bajo (Hz) y acordes de los colchones
const ROOTS = [55, 43.65, 65.41, 49];
const CHORDS = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 261.63, 329.63],
  [196, 246.94, 293.66],
];
/** La cabina del DJ es la pared de la pista: de ahí sale la música (sonido espacial al girar) */
const DJ = ZONAS_CLUB.findIndex((z) => z.id === "musica");
const DJ_ANGLE = (DJ * Math.PI * 2) / ZONAS_CLUB.length;

class ClubAudio {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  private door!: BiquadFilterNode;
  private pan!: StereoPannerNode;
  private bus!: GainNode;
  private send!: GainNode;
  private noise!: AudioBuffer;
  private timer = 0;
  private next = 0;
  private step = 0;
  private origin = 0;
  private lastSet = { cut: 0, gain: 0, at: 0, rel: 0 };
  on = false;
  private depth = 0;
  private zone = 0;
  private yaw = 0;

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    // La puerta: un pasa bajos que se abre al entrar
    this.door = ctx.createBiquadFilter();
    this.door.type = "lowpass";
    this.door.frequency.value = 260;
    this.door.Q.value = 0.6;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.8;
    // La cabina en el espacio: un paneo según hacia dónde mira la cámara
    this.pan = ctx.createStereoPanner();
    this.bus.connect(comp).connect(this.door).connect(this.pan).connect(this.out).connect(ctx.destination);
    // Reverberación de sala (respuesta al impulso generada: ruido que decae)
    const len = Math.floor(ctx.sampleRate * 1.9);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    this.send = ctx.createGain();
    this.send.gain.value = 0.35;
    this.send.connect(verb).connect(this.door);
    // Ruido blanco para palmas y platillos
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }

  async start() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    await ctx.resume();
    if (this.on) return;
    this.on = true;
    this.step = 0;
    this.next = ctx.currentTime + 0.08;
    this.origin = this.next;
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.apply(true);
  }

  stop() {
    if (!this.ctx || !this.on) return;
    this.on = false;
    window.clearInterval(this.timer);
    const ctx = this.ctx;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    window.setTimeout(() => {
      if (!this.on) void ctx.suspend();
    }, 700);
  }

  /** Pulso actual en tiempos de negra (con decimales). Sin sonido, un reloj interno al mismo tempo */
  beat(nowMs: number) {
    if (this.on && this.ctx) return Math.max(0, (this.ctx.currentTime - this.origin) / SPB);
    return nowMs / 1000 / SPB;
  }

  /** Dónde está la persona: afuera (0), adentro (1) o metida en una zona (2); qué zona mira y hacia dónde (giro) */
  setPlace(depth: number, zone: number, yaw = 0) {
    this.depth = depth;
    this.zone = zone;
    this.yaw = yaw;
    this.apply(false);
  }

  private apply(force: boolean) {
    if (!this.ctx || !this.on) return;
    const d = Math.max(0, Math.min(2, this.depth));
    const inside = Math.min(1, d);
    const deep = Math.max(0, d - 1);
    const dj = this.zone === DJ ? deep : 0;
    // Afuera ~260 Hz (el bajo a través del muro); adentro 4,8 kHz; en la cabina, abierto
    // Adentro, la música viene de la cabina: suena a la derecha o a la izquierda según el giro, y más opaca de espaldas
    const rel = DJ_ANGLE + this.yaw;
    const front = (1 + Math.cos(rel)) / 2;
    const cut = 260 * Math.pow(4800 / 260, inside) * (1 + dj * 2.2) * (1 - inside * 0.35 * (1 - front));
    const gain = (0.5 + inside * 0.4 + dj * 0.35) * 0.42 * (1 - inside * 0.25 * (1 - front));
    const now = this.ctx.currentTime;
    const changed = Math.abs(cut - this.lastSet.cut) / Math.max(1, this.lastSet.cut) > 0.03 || Math.abs(gain - this.lastSet.gain) > 0.01 || Math.abs(rel - this.lastSet.rel) > 0.05;
    if (!force && (!changed || now - this.lastSet.at < 0.08)) return;
    this.lastSet = { cut, gain, at: now, rel };
    this.door.frequency.setTargetAtTime(Math.min(16000, cut), now, 0.09);
    this.pan.pan.setTargetAtTime(Math.sin(rel) * 0.8 * inside, now, 0.12);
    this.out.gain.setTargetAtTime(gain, now, force ? 0.5 : 0.12);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.next < ctx.currentTime + 0.12) {
      this.play(this.step, this.next);
      this.next += STEP;
      this.step++;
    }
  }

  private play(step: number, t: number) {
    const s = step % 16;
    const bar = Math.floor(step / 16) % 4;
    if (s % 4 === 0) this.kick(t);
    if (s === 4 || s === 12) this.clap(t);
    if (s % 4 === 2) this.hat(t, true);
    else if (s % 2 === 1) this.hat(t, false);
    // Bajo en los contratiempos, con un salto de octava al final del compás
    if (s === 2 || s === 6 || s === 10 || s === 14 || s === 15) this.bass(t, ROOTS[bar] * (s === 15 ? 2 : 1), s === 15 ? STEP * 0.9 : STEP * 1.6);
    if (s === 0) this.pad(t, CHORDS[bar], SPB * 4);
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    this.env(g, t, 0.95, 0.004, 0.42);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.5);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, q: number, peak: number, decay: number, verb = 0) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.002, decay);
    src.connect(f).connect(g).connect(this.bus);
    if (verb) {
      const s = ctx.createGain();
      s.gain.value = verb;
      g.connect(s).connect(this.send);
    }
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
  }

  private clap(t: number) {
    // Tres golpes casi juntos y una cola: la palma de una pista de baile
    for (const k of [0, 0.011, 0.023]) this.noiseHit(t + k, "bandpass", 1500, 0.8, 0.45, 0.03);
    this.noiseHit(t + 0.03, "bandpass", 1300, 0.7, 0.4, 0.18, 0.6);
  }

  private hat(t: number, open: boolean) {
    this.noiseHit(t, "highpass", 7600, 0.7, open ? 0.16 : 0.06, open ? 0.09 : 0.03);
  }

  private bass(t: number, freq: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 6;
    f.frequency.setValueAtTime(180, t);
    f.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    f.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = ctx.createGain();
    this.env(g, t, 0.32, 0.006, dur);
    o.connect(f).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private pad(t: number, chord: number[], dur: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.35);
    g.gain.setValueAtTime(0.03, t + dur - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(this.bus);
    const s = ctx.createGain();
    s.gain.value = 0.8;
    g.connect(s).connect(this.send);
    for (const hz of chord)
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = hz;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
  }
}

export const clubAudio = new ClubAudio();
