/** Contraste de color: WCAG 2.2 (razón) y APCA-W3 0.0.98G (|Lc|). Sin dependencias. */
type RGB = [number, number, number];

export const hexToRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

export function wcagRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Magnitud APCA (texto sobre fondo). Lc 90 cuerpo pequeño, 75 cuerpo, 60 títulos y controles, 45 metadatos. */
export function apcaLc(text: string, bg: string): number {
  const Y = ([r, g, b]: RGB) => 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
  const clampY = (y: number) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const yt = clampY(Y(hexToRgb(text)));
  const yb = clampY(Y(hexToRgb(bg)));
  const lc = yb > yt ? (yb ** 0.56 - yt ** 0.57) * 1.14 : (yb ** 0.65 - yt ** 0.62) * 1.14;
  if (Math.abs(lc) < 0.1) return 0;
  return Math.abs((lc > 0 ? lc - 0.027 : lc + 0.027) * 100);
}
