// Web Audio API Synthesized Sound Generator & Haptic Feedback
// Zero external audio assets required; lightweight, resilient, and instant.

export const MUTE_KEY = "tonight_muted";
export const MUTE_EVENT = "tonight-mute-change";

class SoundEngine {
  private ctx: AudioContext | null = null;

  isMuted(): boolean {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean) {
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event(MUTE_EVENT));
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined" || this.isMuted()) return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Crea el contexto de audio por adelantado, en un momento de calma (no lo arranca: los navegadores esperan un toque).
   * Crearlo toma cientos de milisegundos en algunos equipos: si se hace al primer sonido, congela justo esa jugada.
   */
  warm() {
    if (typeof window === "undefined" || this.isMuted() || this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      /* sin audio */
    }
  }

  /** El mismo contexto para todos los sonidos de la app (uno solo: cada contexto nuevo cuesta) */
  shared(): AudioContext | null {
    return this.getContext();
  }

  /** Nota corta programada en el reloj de audio (para secuencias exactas sin temporizadores) */
  private note(ctx: AudioContext, at: number, freq: number, dur: number, type: OscillatorType = "triangle", vol = 0.1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  /** Rodillos de tragamonedas: tic-tic mecánico que se va frenando (para el revelado de los juegos) */
  playReels(ms: number = 1300) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      let t = 0;
      let k = 0;
      while (t < ms / 1000) {
        const p = t / (ms / 1000);
        this.note(ctx, ctx.currentTime + t, k % 2 ? 1180 : 940, 0.03, "square", 0.035);
        t += 0.045 + p * p * 0.16;
        k++;
      }
      // El golpe del rodillo al detenerse
      this.note(ctx, ctx.currentTime + t, 330, 0.09, "square", 0.06);
    } catch {}
  }

  /** Premio: arpegio ascendente con brillo final, como cuando la tragamonedas paga (solo puntos) */
  playJackpot() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.note(ctx, t0 + i * 0.085, f, 0.16, "triangle", 0.09));
      [1046.5, 1318.5, 1568].forEach((f) => this.note(ctx, t0 + 0.47, f, 0.55, "sine", 0.05));
    } catch {}
  }

  /** Moneda: dos notas rápidas al sumar puntos */
  playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      this.note(ctx, t0, 987.77, 0.07, "square", 0.05);
      this.note(ctx, t0 + 0.07, 1318.5, 0.22, "square", 0.05);
    } catch {}
  }

  // Tick click sound (Roulette, countdown step)
  playTick(frequency: number = 750, duration: number = 0.04) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch {}
  }

  // Bomb fuse acceleration beep
  playBombBeep(freq: number = 550) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // Bomb Explosion or Major Failure
  playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.52);
    } catch {}
  }

  // Success fanfare (Major chord arpeggio)
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  }

  // Danger alert chime (Designated driver drink detected)
  playDangerAlert() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [880, 440, 880, 440].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.11);
      });
    } catch {}
  }

  // Burbujeo líquido (servir un trago, vaso de agua o capa en el bar)
  playBubble() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.055 + Math.random() * 0.02;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const f = 380 + Math.random() * 420;
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.06);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch {}
  }

  // Fanfarria de revelación (votaciones, premios del Wrapped)
  playReveal() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const chord = [392, 493.88, 587.33, 783.99];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 ? "triangle" : "sawtooth";
        osc.frequency.setValueAtTime(freq / 2, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.18);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
      });
    } catch {}
  }

  // Haptic feedback safely wrapped
  triggerHaptic(pattern: number | number[] = 50) {
    if (typeof window !== "undefined" && "vibrate" in navigator && !this.isMuted()) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const audioEffects = new SoundEngine();
