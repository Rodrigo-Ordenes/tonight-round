import type { CarreteEvent } from "@/lib/carreteState";

/** Los navegadores limitan a 64 KB lo que puede enviarse mientras la página se cierra. */
const MAX_BYTES = 60_000;

/** Cuerpo del envío de salida: los primeros eventos pendientes que quepan. El resto sale al volver. */
export function keepaliveBody(events: CarreteEvent[]): string | null {
  const size = (e: CarreteEvent[]) => new TextEncoder().encode(JSON.stringify({ events: e })).length;
  const fit: CarreteEvent[] = [];
  for (const ev of events) {
    if (size([...fit, ev]) > MAX_BYTES) break;
    fit.push(ev);
  }
  return fit.length ? JSON.stringify({ events: fit }) : null;
}
