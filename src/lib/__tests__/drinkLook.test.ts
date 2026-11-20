import { describe, expect, it } from "vitest";
import { RECIPES } from "@/data/drinks";
import { blendColor, drinkLook } from "@/lib/drinkLook";

const recipe = (id: string) => {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) throw new Error(`falta la receta ${id}`);
  return r;
};
const luminance = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);

describe("cómo se ve cada trago", () => {
  it("la piscola es café oscuro: un cuarto de pisco casi no aclara la bebida cola", () => {
    const r = recipe("piscola");
    expect(luminance(blendColor(r.spec))).toBeLessThan(70);
  });

  it("el pisco sour lleva espuma y gotas de amargo, sin hielo en el vaso (el hielo queda en la coctelera)", () => {
    const r = recipe("pisco_sour");
    const look = drinkLook(r.spec, r.glass, r.garnish);
    expect(look.foam).toBe("clara");
    expect(look.bitters).toBe(true);
    expect(look.ice).toBeNull();
    expect(look.citrus).toBe(false);
  });

  it("el terremoto lleva la bola de helado con su chorrito", () => {
    const r = recipe("terremoto");
    const look = drinkLook(r.spec, r.glass, r.garnish);
    expect(look.scoop).toBe(true);
    expect(look.drizzle).not.toBeNull();
    expect(look.sinks).toBeNull();
  });

  it("la michelada lleva borde de sal y espuma de cerveza", () => {
    const r = recipe("michelada_cl");
    const look = drinkLook(r.spec, r.glass, r.garnish);
    expect(look.salt).toBe(true);
    expect(look.foam).toBe("cerveza");
  });

  it("en la Shirley Temple la granadina se va al fondo y el mojito lleva hielo picado y bombilla", () => {
    const shirley = recipe("shirley_temple");
    expect(drinkLook(shirley.spec, shirley.glass).sinks).not.toBeNull();
    const mojito = recipe("mojito");
    const look = drinkLook(mojito.spec, mojito.glass);
    expect(look.ice).toBe("picado");
    expect(look.straw).toBe(true);
    expect(look.mint).toBe(true);
  });
});
