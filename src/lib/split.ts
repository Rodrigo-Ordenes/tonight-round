import type { Expense, Participant, SplitMode } from "./carreteState";
import { pureGrams } from "./alcohol";

export interface PersonBalance {
  id: string;
  name: string;
  paid: number;
  share: number;
  /** positivo = le deben; negativo = debe */
  balance: number;
  drinks: boolean;
  alcoholShare: number;
  commonShare: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface SplitResult {
  total: number;
  alcoholTotal: number;
  commonTotal: number;
  people: PersonBalance[];
  transfers: Transfer[];
  /** Modo efectivo (consumo cae a justo si nadie registró tragos) */
  effectiveMode: SplitMode;
}

/** Unidad de redondeo por país: nadie transfiere $3. */
export const ROUND_UNIT: Record<string, number> = { CL: 10, MX: 1, US: 0.01, JP: 10 };

const roundTo = (x: number, unit: number) => Math.round(x / unit) * unit;

/**
 * División justa del carrete:
 * - iguales: todos pagan lo mismo.
 * - justo: la canasta común se divide entre todos; el alcohol, solo entre quienes toman (conductor 0.0 y abstemios no pagan alcohol).
 * - consumo: el alcohol se reparte en proporción a los gramos registrados en el Monstruómetro.
 */
export function computeSplit(
  participants: Participant[],
  expenses: Expense[],
  mode: SplitMode,
  soberIds: string[],
  unit = 10
): SplitResult {
  const people = participants.filter((p) => !p.deleted);
  const alcoholTotal = expenses.filter((e) => e.category === "alcohol").reduce((a, e) => a + e.amount, 0);
  const commonTotal = expenses.filter((e) => e.category === "comun").reduce((a, e) => a + e.amount, 0);
  const total = alcoholTotal + commonTotal;
  const n = Math.max(1, people.length);
  const sober = new Set(soberIds);

  const grams = new Map(people.map((p) => [p.id, p.consumptions.reduce((a, c) => a + pureGrams(c.ml, c.abv), 0)]));
  const anyLogged = Array.from(grams.values()).some((g) => g > 0);
  const effectiveMode: SplitMode = mode === "consumo" && !anyLogged ? "justo" : mode;
  // Toma alcohol: no es conductor ni abstemio; en modo consumo además debe tener tragos registrados.
  const drinks = (p: Participant) =>
    p.role !== "driver" && !sober.has(p.id) && (effectiveMode !== "consumo" || (grams.get(p.id) ?? 0) > 0);
  const drinkers = people.filter(drinks);
  const totalGrams = drinkers.reduce((a, p) => a + (grams.get(p.id) ?? 0), 0);

  const rows: PersonBalance[] = people.map((p) => {
    let alcoholShare = 0;
    let commonShare = 0;
    if (effectiveMode === "iguales") {
      alcoholShare = alcoholTotal / n;
      commonShare = commonTotal / n;
    } else {
      commonShare = commonTotal / n;
      if (drinkers.length === 0) alcoholShare = alcoholTotal / n;
      else if (!drinks(p)) alcoholShare = 0;
      else if (effectiveMode === "consumo" && totalGrams > 0) alcoholShare = (alcoholTotal * (grams.get(p.id) ?? 0)) / totalGrams;
      else alcoholShare = alcoholTotal / drinkers.length;
    }
    const share = alcoholShare + commonShare;
    const paid = expenses.filter((e) => e.payerId === p.id).reduce((a, e) => a + e.amount, 0);
    return { id: p.id, name: p.name, paid, share, balance: paid - share, drinks: drinks(p), alcoholShare, commonShare };
  });

  return { total, alcoholTotal, commonTotal, people: rows, transfers: settle(rows, unit), effectiveMode };
}

/** Saldar con el mínimo práctico de transferencias (greedy: el que más debe le paga al que más le deben). */
export function settle(rows: PersonBalance[], unit: number): Transfer[] {
  const debtors = rows.filter((r) => r.balance < -unit / 2).map((r) => ({ id: r.id, amt: -r.balance }));
  const creditors = rows.filter((r) => r.balance > unit / 2).map((r) => ({ id: r.id, amt: r.balance }));
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    const amount = roundTo(pay, unit);
    if (amount > 0) out.push({ from: debtors[i].id, to: creditors[j].id, amount });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt <= unit / 2) i++;
    if (creditors[j].amt <= unit / 2) j++;
  }
  return out;
}
