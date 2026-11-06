import { emptyCarrete, type CarreteEvent, type CarreteState, type Participant } from "@/lib/carreteState";

let n = 0;
export const ev = (a: Omit<CarreteEvent, "eventId" | "at"> & { eventId?: string; at?: number }): CarreteEvent =>
  ({ eventId: a.eventId ?? `e${++n}`, at: a.at ?? 1_000 + n, ...a }) as CarreteEvent;

export function person(id: string, over: Partial<Participant> = {}): Participant {
  return {
    id,
    name: id,
    gender: "M",
    weightKg: 75,
    role: "drinker",
    consumptions: [],
    waterCount: 0,
    water: [],
    removedIds: [],
    status: "party",
    commune: "",
    arrivedAt: null,
    resurrectionLabel: "",
    resurrectionHour: null,
    resurrectionMode: "functional",
    active: true,
    joinedAt: 1,
    updatedAt: 1,
    ...over,
  };
}

export const room = (): CarreteState => emptyCarrete("TEST");
