import { describe, expect, it } from "vitest";
import { lastDrink } from "@/lib/lastDrink";

const c = (id: string, abv: number, ts: number) => ({ id, label: id, ml: 300, abv, ts });

describe("último trago", () => {
  it("devuelve el más reciente con alcohol", () => expect(lastDrink([c("a", 0.1, 1), c("b", 0.05, 3), c("c", 0, 5)])?.id).toBe("b"));
  it("sin tragos con alcohol devuelve null", () => {
    expect(lastDrink([])).toBeNull();
    expect(lastDrink([c("a", 0, 1)])).toBeNull();
  });
});
