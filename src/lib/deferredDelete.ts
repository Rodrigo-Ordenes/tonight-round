/**
 * Borrar con ventana para deshacer. Las marcas de borrado de la sala son permanentes, así que no se puede
 * revertir después: la acción se retrasa y la interfaz oculta el ítem mientras tanto.
 */
export function createDeferredDelete(commit: (id: string) => void, delayMs = 5000) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const finish = (id: string) => {
    timers.delete(id);
    commit(id);
  };
  return {
    schedule(id: string) {
      if (!timers.has(id)) timers.set(id, setTimeout(() => finish(id), delayMs));
    },
    undo(id: string) {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
    },
    flush() {
      for (const [id, t] of Array.from(timers)) {
        clearTimeout(t);
        finish(id);
      }
    },
    pending: () => new Set(timers.keys()),
  };
}
