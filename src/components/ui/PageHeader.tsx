import React from "react";
import GhostTitle from "./GhostTitle";

/**
 * Cabecera común a todas las secciones. El título habla solo; el contexto (sala, modo, hora)
 * va debajo como línea de apoyo, nunca como etiqueta sobre el título.
 */
export default function PageHeader({
  eyebrow,
  title,
  accent = ".",
  children,
  aside,
}: {
  /** Contexto breve (ej. "Sala 5DCS"). Se muestra bajo el título. */
  eyebrow?: string;
  title: string;
  accent?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="relative isolate mb-8 flex flex-wrap items-end justify-between gap-6 animate-fade-in">
      <GhostTitle text={title} />
      <div className="max-w-2xl">
        <h1 className="display parallax-near text-display-lg" aria-label={`${title}${accent}`}>
          {/* Entrada por palabras con máscara (CSS); el texto completo queda en aria-label */}
          {title.split(" ").map((word, i) => (
            <span key={i} aria-hidden className="word-mask">
              <span className="word-in" style={{ animationDelay: `${60 + i * 70}ms` }}>
                {word}
                {i === title.split(" ").length - 1 && <span className="text-accent">{accent}</span>}
              </span>{" "}
            </span>
          ))}
        </h1>
        {eyebrow && <p className="meta mt-3">{eyebrow}</p>}
        {children && <div className="mt-2 max-w-[65ch] text-base leading-relaxed text-slate-300">{children}</div>}
      </div>
      {aside}
    </header>
  );
}
