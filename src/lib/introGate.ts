/** Clave que marca la intro del trago como vista en este navegador. */
export const INTRO_SEEN_KEY = "tonight_intro_seen";

/**
 * Script en línea del <head>: si la intro ya se vio, la apaga antes del primer pintado (data-intro="off").
 * Así la portada no salta cuando la intro llega desde el servidor y luego se oculta.
 */
export const INTRO_GATE_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})==="1")document.documentElement.dataset.intro="off"}catch(e){}`;

/** Evento de ventana para volver a mostrar la intro desde el inicio («Ver la ronda») */
export const INTRO_REPLAY_EVENT = "tonight:intro-replay";
