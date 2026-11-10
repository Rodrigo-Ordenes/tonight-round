import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDeferredDelete } from "@/lib/deferredDelete";

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe("borrado con deshacer", () => {
  it("confirma a los 5 s y mientras tanto queda pendiente", () => {
    const commit = vi.fn();
    const d = createDeferredDelete(commit);
    d.schedule("a");
    expect(d.pending().has("a")).toBe(true);
    vi.advanceTimersByTime(4999);
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(commit).toHaveBeenCalledWith("a");
    expect(d.pending().size).toBe(0);
  });

  it("deshacer evita el borrado", () => {
    const commit = vi.fn();
    const d = createDeferredDelete(commit);
    d.schedule("a");
    d.undo("a");
    vi.advanceTimersByTime(6000);
    expect(commit).not.toHaveBeenCalled();
  });

  it("salir de la página completa lo pendiente una sola vez", () => {
    const commit = vi.fn();
    const d = createDeferredDelete(commit);
    d.schedule("a");
    d.schedule("b");
    d.flush();
    vi.advanceTimersByTime(6000);
    expect(commit.mock.calls.map((c) => c[0]).sort()).toEqual(["a", "b"]);
  });
});
