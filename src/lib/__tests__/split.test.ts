import { describe, expect, it } from "vitest";
import { computeSplit } from "@/lib/split";
import type { Expense } from "@/lib/carreteState";
import { person } from "./fixtures";

const withGrams = (id: string, grams: number, role: "drinker" | "driver" = "drinker") =>
  person(id, { role, consumptions: grams ? [{ id: `${id}c`, label: "x", ml: grams / 0.8 / 0.4, abv: 0.4, ts: 1 }] : [] });

const people = [withGrams("juan", 60), withGrams("cami", 20), withGrams("pedro", 0, "driver"), withGrams("ana", 20)];
const expenses: Expense[] = [
  { id: "1", payerId: "juan", description: "Botillería", amount: 30000, category: "alcohol", at: 1 },
  { id: "2", payerId: "cami", description: "Pizzas", amount: 20000, category: "comun", at: 2 },
];

describe("división de cuentas", () => {
  it.each(["iguales", "justo", "consumo"] as const)("en modo %s los saldos suman cero", (mode) => {
    const r = computeSplit(people, expenses, mode, [], 10);
    expect(Math.round(r.people.reduce((a, p) => a + p.balance, 0))).toBe(0);
  });

  it("en modo justo el conductor solo paga la parte común", () => {
    const pedro = computeSplit(people, expenses, "justo", [], 10).people.find((p) => p.id === "pedro")!;
    expect(pedro.alcoholShare).toBe(0);
    expect(pedro.share).toBe(5000);
  });
});

import { normalizePayLink } from "@/lib/split";

describe("link de pago", () => {
  it("acepta links https de pago", () => expect(normalizePayLink(" https://link.mercadopago.cl/juan ")).toBe("https://link.mercadopago.cl/juan"));
  it("agrega https si falta", () => expect(normalizePayLink("venmo.com/u/juan")).toBe("https://venmo.com/u/juan"));
  it("rechaza esquemas peligrosos", () => expect(normalizePayLink("javascript:alert(1)")).toBeNull());
  it("rechaza texto que no es link", () => expect(normalizePayLink("mi cuenta rut 123")).toBeNull());
});
