// Generado por scripts/procesar-escena.py: vasos de la intro (lleno y vacío, mismo encuadre; top/bottom = tramo
// del líquido en fracción del alto) y el host de la bienvenida.
export const FOTOS_INTRO: Record<string, { lleno: string; vacio: string; w: number; h: number; top: number; bottom: number }> = {
  "piscola": {
    "lleno": "/fotos/intro/piscola.webp",
    "vacio": "/fotos/intro/piscola_vacio.webp",
    "w": 240,
    "h": 520,
    "top": 0.071,
    "bottom": 0.952
  },
  "cerveza": {
    "lleno": "/fotos/intro/cerveza.webp",
    "vacio": "/fotos/intro/cerveza_vacio.webp",
    "w": 261,
    "h": 520,
    "top": 0.079,
    "bottom": 0.925
  },
  "vino": {
    "lleno": "/fotos/intro/vino.webp",
    "vacio": "/fotos/intro/vino_vacio.webp",
    "w": 229,
    "h": 520,
    "top": 0.3,
    "bottom": 0.577
  },
  "agua": {
    "lleno": "/fotos/intro/agua.webp",
    "vacio": "/fotos/intro/agua_vacio.webp",
    "w": 240,
    "h": 520,
    "top": 0.025,
    "bottom": 0.95
  }
};

export const FOTO_HOST: { src: string; w: number; h: number } | null = {"src": "/fotos/host/barman.webp", "w": 688, "h": 1100};
