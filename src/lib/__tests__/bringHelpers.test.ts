import { describe, expect, it } from "vitest";
import { bringSuggestions, newBringItem } from "@/lib/bring";
import type { BasketItem, BringState } from "@/lib/carreteState";

const empty: BringState = { items: [], removed: [] };
const basketItem = (id: string, name: string, quantity = 1) =>
  ({ id, name, category: "x", quantity, unit: "u", prices: { lider: 1, jumbo: 1, botilleria_ref: 1 } }) as BasketItem;

describe("nuevo ítem de «Yo llevo»", () => {
  it("usa un id estable por nombre (dos celulares que agregan «Hielo» no lo duplican)", () => {
    expect(newBringItem("Hielo", empty)).toEqual({ id: "hielo", label: "Hielo" });
  });
  it("si ya hay uno vivo con el mismo nombre no agrega otro", () => {
    expect(newBringItem("  hielo ", { items: [{ id: "hielo", label: "Hielo" }], removed: [] })).toBeNull();
  });
  it("un ítem borrado por error se puede volver a agregar con otro id", () => {
    expect(newBringItem("Hielo", { items: [], removed: ["hielo"] })).toEqual({ id: "hielo-2", label: "Hielo" });
    expect(newBringItem("Hielo", { items: [], removed: ["hielo", "hielo-2"] })!.id).toBe("hielo-3");
  });
});

describe("sugerencias de «Yo llevo»", () => {
  it("parten por lo que está en la canasta de la sala y luego lo básico", () => {
    const s = bringSuggestions([basketItem("p", "Pisco Mistral 35° 1L", 2), basketItem("c", "Coca-Cola 3L")], empty);
    expect(s.slice(0, 2)).toEqual(["Pisco Mistral 35° 1L ×2", "Coca-Cola 3L"]);
    expect(s).toContain("Hielo");
  });
  it("no sugiere lo que ya está en la lista y sí lo que se borró", () => {
    const s = bringSuggestions([], { items: [{ id: "hielo", label: "Hielo" }], removed: ["vasos"] });
    expect(s).not.toContain("Hielo");
    expect(s).toContain("Vasos");
  });
});
