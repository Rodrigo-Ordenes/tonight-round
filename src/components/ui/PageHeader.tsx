import React from "react";

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
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 animate-fade-in">
      <div className="max-w-2xl">
        <h1 className="display text-display-lg">
          {title}
          <span className="text-accent">{accent}</span>
        </h1>
        {eyebrow && <p className="meta mt-3">{eyebrow}</p>}
        {children && <div className="mt-2 max-w-[65ch] text-base leading-relaxed text-slate-300">{children}</div>}
      </div>
      {aside}
    </header>
  );
}
