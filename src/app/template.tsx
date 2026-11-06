/**
 * Se vuelve a montar en cada navegación: un fundido breve (200 ms) evita que la sección
 * "teletransporte". Con reduced-motion queda solo el fundido (ver globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
