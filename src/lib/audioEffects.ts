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

  triggerHaptic(pattern?: number | number[]) {
    baseAudioEffects.triggerHaptic(pattern);
  }
}

export const audioEffects = new ExtendedAudioEffects();
export default audioEffects;
