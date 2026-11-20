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
  { game: "Ruleta del casino", picks: [/Morado · paga 10/, /Cero · paga 60/], result: /Salió el \d+/ },
  { game: "Blackjack contra el host", picks: [/Me planto en 15/, /Me planto en 19/], result: /El host hizo \d+/ },
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

      await page.goto("/juegos");
      const card = page.locator("article", { has: page.getByRole("heading", { name: r.game }) });
      // La mesa puede tardar en recibir a los celulares recién unidos: si aún no los ve, rechaza la ronda; se reintenta
      await expect(async () => {
        await card.getByRole("button", { name: "Jugar" }).click();
        await expect(nacho.getByRole("button", { name: r.picks[0] })).toBeVisible({ timeout: 4_000 });
      }).toPass({ timeout: 40_000 });
      for (const [p, pick] of [
        [nacho, r.picks[0]],
        [cote, r.picks[1]],
      ] as const) {
        const btn = p.getByRole("button", { name: pick });
        await expect(btn).toBeVisible({ timeout: 15_000 });
        await btn.click();
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
