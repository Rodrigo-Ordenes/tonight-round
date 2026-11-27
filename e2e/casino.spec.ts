import { devices, expect, test, type Browser, type Page } from "@playwright/test";

// Casino de puntos en vivo: cada celular elige su jugada en secreto, la mesa revela y queda la escena (ruleta, mesa
// de blackjack o tragamonedas) con el resultado. Sin plata: solo puntos.
const SEEN = () => {
  localStorage.setItem("tonight_disclaimer_ack", "true");
  localStorage.setItem("tonight_intro_seen", "1");
};

async function phone(browser: Browser, url: string, name: string): Promise<Page> {
  const ctx = await browser.newContext({ ...devices["Pixel 7"] });
  await ctx.addInitScript(SEEN);
  const page = await ctx.newPage();
  await page.goto(url);
  await page.getByLabel("Nombre o apodo").fill(name);
  await page.getByRole("button", { name: "Entrar a la sala" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return page;
}

const ROUNDS = [
  { game: "Ruleta del casino", picks: [[/Ficha a morado/, /Ficha a el 17/, /^Apostar$/], [/Ficha a cero/, /^Apostar$/]], result: /Salió el \d+/ },
  { game: "Blackjack contra el host", picks: [/Plantarme|Cobrar/, /Plantarme|Cobrar/], result: /El host hizo \d+/, hit: true },
  { game: "Tragamonedas del bar", picks: [/Tirar la palanca/, /Tirar la palanca/], result: /Jackpot|Pagó la máquina|Premios chicos|Los rodillos no pagaron/ },
];

test.describe("Casino de puntos", () => {
  for (const r of ROUNDS) {
    test(`${r.game}: cada celular juega y la mesa revela`, async ({ page, browser }, info) => {
      test.skip(info.project.name !== "escritorio", "La mesa usa escritorio; los celulares se crean aparte");
      await page.addInitScript(SEEN);
      await page.goto("/");
      await page.getByRole("button", { name: /Crear sala/ }).click();
      await page.waitForURL(/\/carrete\/[A-Z0-9]{6}\?invitar=1/);
      const code = new URL(page.url()).pathname.split("/").pop()!;
      await page.getByRole("button", { name: "Ahora no" }).click();
      const url = `/carrete/${code}?modo=celular`;
      const nacho = await phone(browser, url, "Nacho");
      const cote = await phone(browser, url, "Coté");

      await page.goto("/casino");
      const card = page.locator("article", { has: page.getByRole("heading", { name: r.game }) });
      // La mesa puede tardar en recibir a los celulares recién unidos: si aún no los ve, rechaza la ronda; se reintenta
      await expect(async () => {
        await card.getByRole("button", { name: "Jugar", exact: true }).click();
        await expect(nacho.getByRole("button", { name: [r.picks[0]].flat()[0] })).toBeVisible({ timeout: 4_000 });
      }).toPass({ timeout: 40_000 });
      // Blackjack mano a mano: Nacho pide una carta antes de plantarse (si no se pasó ni llegó a 21)
      if ("hit" in r && r.hit) {
        const pedir = nacho.getByRole("button", { name: "Pedir carta" });
        if (await pedir.isVisible()) await pedir.click();
      }
      for (const [p, pick] of [
        [nacho, r.picks[0]],
        [cote, r.picks[1]],
      ] as const) {
        if ("hit" in r && r.hit && (await p.getByText(/Mira la mesa en la TV/).isVisible())) continue;
        // Una jugada puede ser varios toques: fichas en el paño y después «Apostar»
        for (const name of [pick].flat()) {
          const btn = p.getByRole("button", { name });
          await expect(btn).toBeVisible({ timeout: 15_000 });
          await btn.click();
        }
      }
      await expect(page.getByText("Votaron 2 de 2")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Revelar" }).click();
      await expect(page.getByText(r.result).first()).toBeVisible({ timeout: 15_000 });
      await expect(nacho.getByText(r.result).first()).toBeVisible({ timeout: 15_000 });
      // La escena termina de girar o repartir antes de la captura
      await page.waitForTimeout(6000);
      await page.screenshot({ path: info.outputPath("mesa.png"), fullPage: false });
      await nacho.context().close();
      await cote.context().close();
    });
  }
});

test("Casino en este computador: sin sala ni celulares, se juega y corren los créditos", async ({ page }) => {
  await page.addInitScript(SEEN);
  await page.goto("/casino");
  const card = page.locator("article", { has: page.getByRole("heading", { name: "La Frutillita", exact: true }) });
  await card.getByRole("button", { name: /Jugar aquí/ }).click();
  // «Jugar aquí» lleva directo a la mesa a pantalla completa
  await page.waitForURL(/\/casino\/frutillita$/);
  const mesa = page.locator('[data-mesa="frutillita"]');
  await expect(mesa.getByRole("heading", { level: 1, name: "La Frutillita" })).toBeVisible();
  // Juego continuo: se tira, giran y pagan, y la palanca queda lista otra vez sin botón de «Otra vez». Si salen tres
  // frutillas empieza «La vuelta»: con «Cobrar ya» se salta y lo que falta entra de una
  const lever = mesa.getByRole("button", { name: /Tirar la palanca/ });
  const items = mesa.getByRole("list", { name: "Tus últimas tiradas" }).getByRole("listitem");
  const settle = async (n: number) =>
    expect(async () => {
      const cobrar = mesa.getByRole("button", { name: "Cobrar ya" });
      if (await cobrar.isVisible()) await cobrar.click();
      await expect(items).toHaveCount(n, { timeout: 2_000 });
    }).toPass({ timeout: 40_000 });
  await lever.click();
  await settle(1);
  await expect(lever).toBeEnabled({ timeout: 10_000 });
  await lever.click();
  await settle(2);
  await expect(mesa.getByRole("button", { name: /Otra vez/ })).toHaveCount(0);
});

test("Blackjack en la mesa: fichas al círculo, mano tras mano sin reiniciar", async ({ page }) => {
  await page.addInitScript(SEEN);
  await page.goto("/casino/blackjack");
  const mesa = page.locator('[data-mesa="blackjack"]');
  // Las fichas de la bandeja suben al círculo de apuesta
  await mesa.getByRole("button", { name: "Ficha de 25" }).click();
  await expect(mesa.getByRole("button", { name: /^Repartir · 35$/ })).toBeVisible();
  const manos = mesa.getByRole("list", { name: "Tus últimas manos" }).getByRole("listitem");
  for (let i = 1; i <= 3; i++) {
    // Se reparte, se decide jugada a jugada (aquí: plantarse) y el host cierra; la siguiente mano sin reiniciar
    const repartir = mesa.getByRole("button", { name: /^Repartir/ });
    await expect(repartir).toBeEnabled({ timeout: 10_000 });
    await repartir.click();
    const plantarme = mesa.getByRole("button", { name: "Plantarme" });
    // Con blackjack natural no hay nada que decidir: la mesa cierra sola
    await plantarme
      .waitFor({ state: "visible", timeout: 2_500 })
      .then(() => plantarme.click())
      .catch(() => undefined);
    await expect(manos).toHaveCount(i, { timeout: 10_000 });
  }
  await expect(mesa.getByRole("button", { name: /Repartir otra mano/ })).toBeVisible();
});

test("Ruleta en la mesa: fichas en el paño, la bola gira y la mesa paga", async ({ page }) => {
  await page.addInitScript(SEEN);
  await page.goto("/casino");
  const card = page.locator("article", { has: page.getByRole("heading", { name: "Ruleta del casino", exact: true }) });
  await card.getByRole("button", { name: /Jugar aquí/ }).click();
  await page.waitForURL(/\/casino\/ruleta$/);
  const mesa = page.locator('[data-mesa="ruleta"]');
  await mesa.getByRole("button", { name: "Ficha a el 17" }).click();
  await mesa.getByRole("button", { name: "Ficha a morado" }).click();
  await mesa.getByRole("button", { name: /Girar/ }).click();
  await expect(mesa.getByText("No va más. La bola gira…")).toBeVisible();
  await expect(mesa.getByRole("list", { name: "Tus últimas bolas" }).getByRole("listitem")).toHaveCount(1, { timeout: 15_000 });
  await expect(mesa.getByRole("button", { name: "Repetir apuesta" })).toBeEnabled();
});
