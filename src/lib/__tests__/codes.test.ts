import { describe, expect, it } from "vitest";
import { CODE_RE, randomCode } from "@/lib/carreteState";

describe("códigos de sala", () => {
  it("los nuevos tienen 6 caracteres válidos y varían", () => {
    const codes = Array.from({ length: 200 }, randomCode);
    for (const c of codes) {
      expect(c).toHaveLength(6);
      expect(CODE_RE.test(c)).toBe(true);
    }
    expect(new Set(codes).size).toBeGreaterThan(190);
  });
  it.each(["ABCD", "ABCDEF"])("%s es válido", (c) => expect(CODE_RE.test(c)).toBe(true));
  it.each(["ABCDE", "ABCDEFG", "../X", "abcd"])("%s no es válido", (c) => expect(CODE_RE.test(c)).toBe(false));
});
