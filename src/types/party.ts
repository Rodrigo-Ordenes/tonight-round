export type Gender = "M" | "F";

export type ParticipantRole = "drinker" | "designated_driver" | "sober";

export type CriticalLevel = "zero_tolerance" | "functional";

export interface ResurrectionTarget {
  time: string; // "HH:mm" (ej. "11:00")
  date: "today" | "tomorrow";
  criticalLevel: CriticalLevel;
  activityLabel: string; // Ej. "Almuerzo familiar", "Turno laboral", "Manejar a la playa"
}

export interface ConsumedDrinkRecord {
  type: string;
  pureAlcoholGrams: number;
  timestamp: number;
}

export interface Participant {
  id: string;
  name: string;
  gender: Gender;
  weightKg: number;
  role: ParticipantRole;
  resurrectionTarget?: ResurrectionTarget;
  drinksConsumed: ConsumedDrinkRecord[];
  drinks: {
    piscola: number;
    cerveza: number;
    shot: number;
    agua: number;
  };
  startedAt: string;
}
