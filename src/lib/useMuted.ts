"use client";

import { useCallback, useEffect, useState } from "react";
import { MUTE_EVENT } from "@/components/ui/AudioEffects";
import { audioEffects } from "@/lib/audioEffects";

/** Silencio global (sonidos + vibración), persistido en localStorage y compartido entre componentes. */
export function useMuted(): [boolean, (m: boolean) => void] {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    const read = () => setMutedState(audioEffects.isMuted());
    read();
    window.addEventListener(MUTE_EVENT, read);
    return () => window.removeEventListener(MUTE_EVENT, read);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    audioEffects.setMuted(m);
    if (!m) audioEffects.playPop();
  }, []);

  return [muted, setMuted];
}
