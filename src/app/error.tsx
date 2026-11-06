"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center">
      <h1 className="display text-display-lg">
        Se nos cayó el vaso<span className="text-accent">.</span>
      </h1>
      <p className="mt-4 text-slate-300">
        Tus datos de la sala están guardados en este celular. Reintenta; si sigue fallando, recarga la página.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Reintentar
        </button>
        <a href="/" className="btn-ghost">
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
