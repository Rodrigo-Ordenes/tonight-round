import React from "react";

export type Ambiente = "bar" | "club" | "casino" | "musica" | "previa";

/**
 * Foto real de ambiente (public/fotos/ambiente, Unsplash, ver CREDITOS.md) como el plano más lejano de una escena:
 * se queda atrás al bajar (parallax de la app) y un velo oscuro del lado del texto mantiene la lectura. Decorativa.
 */
export default function AmbientPhoto({ name, className = "", veil = "left" }: { name: Ambiente; className?: string; veil?: "left" | "full" }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute -z-20 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/fotos/ambiente/${name}.webp`}
        srcSet={`/fotos/ambiente/${name}-sm.webp 1280w, /fotos/ambiente/${name}.webp 2560w`}
        sizes="100vw"
        alt=""
        decoding="async"
        className="parallax-deep absolute inset-x-0 -top-[10%] h-[120%] w-full select-none object-cover"
      />
      <div
        className={`absolute inset-0 ${
          veil === "left"
            ? "bg-[linear-gradient(90deg,rgba(9,10,13,0.94)_0%,rgba(9,10,13,0.7)_40%,rgba(9,10,13,0.3)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(9,10,13,0.55)_0%,rgba(9,10,13,0.78)_100%)]"
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,#090A0D_100%)]" />
    </div>
  );
}
