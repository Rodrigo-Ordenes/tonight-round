import { describe, expect, it } from "vitest";
import { syncStatus } from "@/lib/syncStatus";
import { acceptTap } from "@/lib/tapGuard";
import { inviteMessage, inviteUrl } from "@/lib/invite";
import { selectablePeople } from "@/lib/myPeople";

describe("estado de conexión", () => {
  it("en vivo sin pendientes", () => expect(syncStatus({ online: true, pending: 0 })).toEqual({ tone: "live", label: "En vivo" }));
  it("enviando con pendientes", () => expect(syncStatus({ online: true, pending: 2 })).toEqual({ tone: "sending", label: "Enviando 2" }));
  it("sin señal con pendientes", () => expect(syncStatus({ online: false, pending: 3 })).toEqual({ tone: "offline", label: "Sin señal, 3 por enviar" }));
  it("sin señal sin pendientes", () => expect(syncStatus({ online: false, pending: 0 })).toEqual({ tone: "offline", label: "Sin señal" }));
});

describe("protección contra doble toque", () => {
  it("el primer toque cuenta", () => expect(acceptTap(null, 1000)).toBe(true));
  it("un toque a 300 ms no cuenta", () => expect(acceptTap(1000, 1300)).toBe(false));
  it("a 700 ms vuelve a contar", () => expect(acceptTap(1000, 1700)).toBe(true));
});

describe("invitación", () => {
  it("arma el enlace al celular de la sala", () =>
    expect(inviteUrl("https://tonight.misitio.cl", "ABC123")).toBe("https://tonight.misitio.cl/carrete/ABC123?modo=celular"));
  it("el mensaje lleva código y enlace", () => {
    const m = inviteMessage("ABC123", "https://x.cl/carrete/ABC123?modo=celular", "Carrete");
    expect(m).toContain("ABC123");
    expect(m).toContain("https://x.cl/carrete/ABC123?modo=celular");
  });
});

describe("personas de este celular", () => {
  const people = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  it("devuelve a quien usa el celular y a quienes agregó, en orden", () =>
    expect(selectablePeople(people, "c", ["a"]).map((p) => p.id)).toEqual(["a", "c"]));
  it("sin identidad ni agregados no hay a quién cambiar", () => expect(selectablePeople(people, null, [])).toEqual([]));
});
