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
