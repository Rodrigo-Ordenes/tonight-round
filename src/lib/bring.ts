import type { BasketItem, BringItem, BringState } from "./carreteState";

/** Básicos que casi todo carrete necesita y nadie recuerda traer. */
export const BRING_BASICS = ["Hielo", "Agua", "Vasos", "Picoteo", "Parlante", "Hielera", "Limones", "Servilletas"];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

const same = (a: string, b: string) => slug(a) === slug(b);

/**
 * Ítem nuevo con id estable por nombre (dos celulares que agregan «Hielo» a la vez no lo duplican).
 * Si ese id quedó borrado, usa «hielo-2», «hielo-3»… para que se pueda volver a agregar. Null si ya está.
 */
export function newBringItem(label: string, bring: BringState): BringItem | null {
  const clean = label.trim().slice(0, 40);
  if (!clean || bring.items.some((i) => same(i.label, clean))) return null;
  const base = slug(clean) || "item";
  const taken = new Set([...bring.items.map((i) => i.id), ...bring.removed]);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return { id, label: clean };
}

/** Sugerencias: primero lo que la sala tiene en la canasta («quién trae el pisco»), luego los básicos. */
export function bringSuggestions(basket: BasketItem[], bring: BringState, max = 8): string[] {
  const fromBasket = basket.slice(0, 4).map((b) => (b.quantity > 1 ? `${b.name} ×${b.quantity}` : b.name).slice(0, 40));
  const out: string[] = [];
  for (const label of [...fromBasket, ...BRING_BASICS]) {
    if (out.some((l) => same(l, label)) || bring.items.some((i) => same(i.label, label))) continue;
    out.push(label);
    if (out.length >= max) break;
  }
  return out;
}
