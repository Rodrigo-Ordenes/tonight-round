"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateRoomError, SOLO, carreteExists, createCarrete, setActiveCode } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

/** Crear la sala, entrar con código o planificar solo: lo mismo desde la portada, el apartado Sala o cualquier vista */
export function useRoomActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async () => {
    audioEffects.playPop();
    setBusy("create");
    setError(null);
    try {
      const code = await createCarrete();
      router.push(`/carrete/${code}?invitar=1`);
    } catch (e) {
      setError(e instanceof CreateRoomError ? e.message : "No se pudo crear la sala. Intenta de nuevo.");
      setBusy(null);
    }
  }, [router]);

  const join = useCallback(
    async (code: string) => {
      if (code.length !== 4 && code.length !== 6) {
        setError("Ingresa el código completo: 6 caracteres (4 en salas antiguas).");
        return;
      }
      setBusy("join");
      const ok = await carreteExists(code);
      setBusy(null);
      if (!ok) {
        audioEffects.playBuzz();
        setError(`La sala ${code} no existe. Revisa el código con quien la creó.`);
        return;
      }
      setActiveCode(code);
      router.push(`/carrete/${code}?modo=celular`);
    },
    [router],
  );

  const solo = useCallback(() => {
    audioEffects.playPop();
    setActiveCode(SOLO);
    router.push(`/carrete/${SOLO}`);
  }, [router]);

  return { busy, error, setError, create, join, solo };
}
