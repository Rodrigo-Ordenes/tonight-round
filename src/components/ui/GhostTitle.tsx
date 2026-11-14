/**
 * Capa lejana de una cabecera: el título en grande, solo en contorno de neón, que se queda atrás al bajar
 * (parallax-deep, CSS ligado al scroll). Va dentro de un contenedor `relative isolate`; es decorativa.
 */
export default function GhostTitle({ text }: { text: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-10 bottom-0 -z-10 overflow-hidden sm:-inset-x-6">
      <span className="ghost-title parallax-deep block whitespace-nowrap">{text}</span>
    </div>
  );
}
