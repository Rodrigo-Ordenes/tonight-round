/** Enlace que abre la sala directo en la vista del celular. */
export function inviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, "")}/carrete/${code}?modo=celular`;
}

/** Mensaje para compartir por WhatsApp o el menú del sistema. */
export function inviteMessage(code: string, url: string, party: string): string {
  return `${party} en Tonight: entra con el código ${code} o desde ${url}`;
}
