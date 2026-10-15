/** Momento de la noche según la hora local: guía el tono de la UI, la música y los juegos sugeridos. */
export type MomentKey = "dia" | "previa" | "peak" | "after";

export interface NightMoment {
  key: MomentKey;
  eyebrow: string;
  title: string;
  hint: string;
  /** Energía musical sugerida 1..5 */
  energy: number;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function nightMoment(d: Date): NightMoment {
  const h = d.getHours();
  const hhmm = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  const day = DAYS[d.getDay()];
  if (h >= 6 && h < 19) {
    return {
      key: "dia",
      eyebrow: `${day} · ${hhmm} · planificando`,
      title: "Se viene la noche.",
      hint: "Arma la lista de compras, el presupuesto y avisa al grupo.",
      energy: 2,
    };
  }
  if (h >= 19 && h < 23) {
    return {
      key: "previa",
      eyebrow: `${day} · ${hhmm} · previa`,
      title: "Calentando motores.",
      hint: "Primeros tragos, música arriba y un juego para romper el hielo.",
      energy: 3,
    };
  }
  if (h >= 23 || h < 3) {
    return {
      key: "peak",
      eyebrow: `${day} · ${hhmm} · en su punto`,
      title: "La noche está arriba.",
      hint: "Juegos en la TV, votos desde el celular y agua entre trago y trago.",
      energy: 5,
    };
  }
  return {
    key: "after",
    eyebrow: `${day} · ${hhmm} · after`,
    title: "Cerrando con estilo.",
    hint: "Canciones para cantar, dividir la cuenta y ver los premios de la noche.",
    energy: 2,
  };
}
