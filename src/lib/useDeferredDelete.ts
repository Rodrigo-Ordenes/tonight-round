"use client";

import { useEffect, useRef, useState } from "react";
import { createDeferredDelete } from "./deferredDelete";

/** Borrado diferido para una lista: `hidden` son los ids a ocultar y `last` el que ofrece deshacer. */
export function useDeferredDelete(commit: (id: string) => void) {
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [last, setLast] = useState<string | null>(null);
  const engine = useRef<ReturnType<typeof createDeferredDelete>>(undefined);
  if (!engine.current) {
    engine.current = createDeferredDelete((id) => {
      commitRef.current(id);
      setHidden(engine.current!.pending());
      setLast((cur) => (cur === id ? null : cur));
    });
  }

  useEffect(() => {
    const flush = () => engine.current!.flush();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return {
    hidden,
    last,
    remove(id: string) {
      engine.current!.schedule(id);
      setHidden(engine.current!.pending());
      setLast(id);
    },
    undo() {
      if (!last) return;
      engine.current!.undo(last);
      setHidden(engine.current!.pending());
      setLast(null);
    },
  };
}
