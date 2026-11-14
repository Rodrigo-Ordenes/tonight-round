/**
 * Se vuelve a montar en cada navegación: la página se funde y sus secciones entran en cascada (`.page-in` en
 * globals.css). El envoltorio solo cambia opacidad: un transform aquí movería las piezas fijas mientras dura.
 * Con movimiento reducido queda solo el fundido.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in animate-fade-in">{children}</div>;
}
