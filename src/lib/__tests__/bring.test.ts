import { describe, expect, it } from "vitest";
import { applyEvents, mergeCarrete } from "@/lib/carreteState";
import { ev, room } from "./fixtures";

const add = ev({ type: "ADD_BRING", item: { id: "hielo", label: "Hielo" } });

describe("lista Yo llevo", () => {
  it("dos reclamos al mismo ítem: gana el primero en aplicarse", () => {
    const s = applyEvents(room(), [add, ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana" }), ev({ type: "CLAIM_BRING", id: "hielo", participantId: "beto" })]);
    expect(s.bring!.items[0].claimedBy).toBe("ana");
  });

  it("quien reclamó puede soltarlo y otro tomarlo", () => {
    const s = applyEvents(room(), [
      add,
      ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana" }),
      ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana" }),
      ev({ type: "CLAIM_BRING", id: "hielo", participantId: "beto" }),
    ]);
    expect(s.bring!.items[0].claimedBy).toBe("beto");
  });

  it("un ítem borrado no vuelve al unir con un estado viejo", () => {
    const withItem = applyEvents(room(), [add]);
    const removed = applyEvents(withItem, [ev({ type: "REMOVE_BRING", id: "hielo" })]);
    expect(mergeCarrete(removed, withItem).bring!.items).toHaveLength(0);
  });
});

describe("Yo llevo entre varios celulares (el servidor manda en ítems que conoce)", () => {
  const claimA = ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana" });

  it("soltar se mantiene aunque otro celular tenga el reclamo viejo", () => {
    const staleC = applyEvents(room(), [add, claimA]);
    const server = applyEvents(staleC, [ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana" })]);
    expect(server.bring!.items[0].claimedBy).toBeUndefined();
    // C sondea: rebase con el servidor como autoridad
    expect(mergeCarrete(staleC, server, "b").bring!.items[0].claimedBy).toBeUndefined();
    // C manda su copia por anti-entropía (PUT): el servidor no la deja ganar
    expect(mergeCarrete(server, staleC, "a").bring!.items[0].claimedBy).toBeUndefined();
  });

  it("gana quien llegó primero al servidor aunque el reloj del otro vaya atrasado", () => {
    const base = applyEvents(room(), [add]);
    const server = applyEvents(base, [ev({ type: "CLAIM_BRING", id: "hielo", participantId: "ana", at: 1001 })]);
    const phoneB = applyEvents(base, [ev({ type: "CLAIM_BRING", id: "hielo", participantId: "beto", at: 1000 })]);
    expect(mergeCarrete(phoneB, server, "b").bring!.items[0].claimedBy).toBe("ana");
    expect(mergeCarrete(server, phoneB, "a").bring!.items[0].claimedBy).toBe("ana");
  });

  it("los ítems que el servidor aún no conoce se conservan", () => {
    const server = applyEvents(room(), [add]);
    const local = applyEvents(server, [ev({ type: "ADD_BRING", item: { id: "vasos", label: "Vasos" } })]);
    expect(mergeCarrete(local, server, "b").bring!.items.map((i) => i.id).sort()).toEqual(["hielo", "vasos"]);
  });
});
