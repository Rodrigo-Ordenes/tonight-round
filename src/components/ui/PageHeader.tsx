import React from "react";

/** Cabecera editorial común a todas las secciones. */
export default function PageHeader({
  eyebrow,
  title,
  accent = ".",
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 animate-fade-in">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display text-display-lg mt-3">
          {title}
          <span className="text-gradient-ember">{accent}</span>
        </h1>
        {children && <div className="mt-3 text-base text-slate-300">{children}</div>}
      </div>
      {aside}
    </header>
  );
}
