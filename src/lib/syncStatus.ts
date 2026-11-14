/** Estado de la conexión de la sala en palabras: se muestra en el celular para que nadie crea que perdió una acción. */
export function syncStatus({ online, pending }: { online: boolean; pending: number }): {
  tone: "live" | "sending" | "offline";
  label: string;
} {
  if (!online) return { tone: "offline", label: pending > 0 ? `Sin señal, ${pending} por enviar` : "Sin señal" };
  if (pending > 0) return { tone: "sending", label: `Enviando ${pending}` };
  return { tone: "live", label: "En vivo" };
}
