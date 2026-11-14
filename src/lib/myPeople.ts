/** Personas que este celular puede controlar: quien lo usa y quienes agregó desde aquí. */
export function selectablePeople<T extends { id: string }>(people: T[], meId: string | null, mine: string[]): T[] {
  const allowed = new Set(mine);
  if (meId) allowed.add(meId);
  return people.filter((p) => allowed.has(p.id));
}

const key = (code: string) => `tonight_mine_${code}`;

export function readMine(code: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(code)) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addMine(code: string, id: string) {
  try {
    const list = readMine(code);
    if (!list.includes(id)) localStorage.setItem(key(code), JSON.stringify([...list, id].slice(-60)));
  } catch {
    /* sin almacenamiento: el selector mostrará solo a quien usa el celular */
  }
}
