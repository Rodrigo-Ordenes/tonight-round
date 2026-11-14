import BackBar from "@/components/ui/BackBar";

/**
 * Fondo de la TV en tres profundidades, pensado para verse a 3 metros: luces lejanas, la contrabarra de la intro al
 * medio y hielo y chispas adelante. Una cámara lenta pasa de lado (cada capa con su amplitud, mismo ritmo: eso da la
 * profundidad) y con cada escena nueva lo cercano entra empujado (`scene` cambia la clave). Decorativo; con
 * movimiento reducido queda quieto.
 */
export default function TvDepth({ scene }: { scene: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <div className="tv-depth-far absolute -inset-[8%]">
        <span className="absolute left-[6%] top-[12%] h-[38vmax] w-[38vmax] rounded-full bg-[radial-gradient(closest-side,rgba(103,170,255,0.12),transparent)]" />
        <span className="absolute right-[4%] top-[30%] h-[44vmax] w-[44vmax] rounded-full bg-[radial-gradient(closest-side,rgba(185,62,243,0.12),transparent)]" />
        <span className="absolute bottom-[2%] left-[38%] h-[24vmax] w-[24vmax] rounded-full bg-[radial-gradient(closest-side,rgba(140,227,190,0.06),transparent)]" />
      </div>
      {/* Solo la franja de las repisas, arriba y chica: de fondo, sin cruzar los textos que se leen desde lejos */}
      <div className="tv-depth-mid absolute -inset-x-[6%] top-[9%] h-[26%]">
        <BackBar opacity={0.09} viewBox="-140 40 680 124" preserveAspectRatio="xMidYMid slice" className="h-full w-full" />
      </div>
      <div key={scene} className="tv-push absolute inset-0">
        <div className="tv-depth-near absolute inset-0">
          <svg viewBox="0 0 40 40" className="absolute bottom-[4%] left-[3%] h-[5vw] w-[5vw] text-indigo-200/20" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="7" y="7" width="26" height="26" rx="6" transform="rotate(14 20 20)" /><path d="M13 14 L19 13" strokeLinecap="round" /></svg>
          <svg viewBox="0 0 40 40" className="absolute right-[9%] top-[18%] h-[3vw] w-[3vw] text-emerald-200/30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 5 V35 M5 20 H35 M10 10 L30 30 M30 10 L10 30" /></svg>
          <svg viewBox="0 0 40 40" className="absolute bottom-[10%] right-[22%] h-[2.4vw] w-[2.4vw] text-purple-200/25" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="20" cy="20" r="13" /></svg>
          <svg viewBox="0 0 40 40" className="absolute left-[44%] top-[8%] h-[2vw] w-[2vw] text-indigo-200/20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="20" cy="20" r="12" /></svg>
        </div>
      </div>
    </div>
  );
}
