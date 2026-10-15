import { audioEffects as baseAudioEffects } from "@/components/ui/AudioEffects";

class ExtendedAudioEffects {
  playTick(frequency?: number, duration?: number) {
    baseAudioEffects.playTick(frequency, duration);
  }

  playPop() {
    baseAudioEffects.playTick(880, 0.05);
    baseAudioEffects.triggerHaptic(20);
  }

  playBuzz() {
    baseAudioEffects.playDangerAlert();
    baseAudioEffects.triggerHaptic([50, 50, 50]);
  }

  playWaterDrop() {
    baseAudioEffects.playTick(1200, 0.08);
    baseAudioEffects.triggerHaptic(15);
  }

  playDangerAlert() {
    baseAudioEffects.playDangerAlert();
  }

  playSuccessChime() {
    baseAudioEffects.playSuccess();
  }

  playBombBeep(freq?: number) {
    baseAudioEffects.playBombBeep(freq);
  }

  playBombExplosion() {
    baseAudioEffects.playExplosion();
  }

  playBubble() {
    baseAudioEffects.playBubble();
    baseAudioEffects.triggerHaptic(12);
  }

  playReveal() {
    baseAudioEffects.playReveal();
    baseAudioEffects.triggerHaptic([30, 40, 60]);
  }

  /** Tic de La Bomba: intensity 0..1 sube la frecuencia de 440 Hz a 880 Hz. */
  playUrgentTick(intensity: number) {
    const i = Math.max(0, Math.min(1, intensity));
    baseAudioEffects.playTick(440 + 440 * i, 0.05);
    if (i > 0.7) baseAudioEffects.triggerHaptic(25);
  }

  isMuted() {
    return baseAudioEffects.isMuted();
  }

  setMuted(m: boolean) {
    baseAudioEffects.setMuted(m);
  }

  triggerHaptic(pattern?: number | number[]) {
    baseAudioEffects.triggerHaptic(pattern);
  }
}

export const audioEffects = new ExtendedAudioEffects();
export default audioEffects;
