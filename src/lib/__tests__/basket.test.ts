import { describe, expect, it } from "vitest";
import { generateBasket } from "@/lib/basket";

describe("canasta multi-licor", () => {
  it("si piden cerveza, ron y gin no aparece pisco", () => {
    const items = generateBasket("clasica", 6, 4, 60000, "cerveza,ron,gin", "lider");
    expect(items.some((i) => i.id.startsWith("pisco_"))).toBe(false);
    expect(items.some((i) => i.id.startsWith("ron_"))).toBe(true);
  });
});
