import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";

// Auditoría con Axe (WCAG 2.1 AA): falla con violaciones serias o críticas. Los iframes de terceros (Spotify) quedan
// fuera: no son nuestros.
const ACK = () => localStorage.setItem("tonight_disclaimer_ack", "true");
const SEEN = () => {
  localStorage.setItem("tonight_disclaimer_ack", "true");
  localStorage.setItem("tonight_intro_seen", "1");
};

async function audit(page: Page, label: string) {
  await page.waitForTimeout(1200);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("iframe").analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const detail = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(detail, `${label}\n${detail.join("\n")}`).toEqual([]);
}

test.describe("accesibilidad", () => {
  test("portada con la intro", async ({ page }) => {
    await page.addInitScript(ACK);
    await page.goto("/");
    await audit(page, "intro");
  });

  for (const path of ["/", "/armar", "/bar", "/juegos", "/musica", "/dividir"]) {
    test(`vista ${path}`, async ({ page }) => {
      await page.addInitScript(SEEN);
      await page.goto(path);
      await audit(page, path);
    });
  }

  test("sala: celular y TV", async ({ page, browser }, info) => {
    test.skip(info.project.name !== "escritorio", "La mesa usa escritorio; el celular se crea aparte");
    await page.addInitScript(SEEN);
    await page.goto("/");
    await page.getByRole("button", { name: /Crear sala/ }).click();
    await page.waitForURL(/\/carrete\/[A-Z0-9]{6}\?invitar=1/);
    const code = new URL(page.url()).pathname.split("/").pop()!;
    await page.getByRole("button", { name: "Ahora no" }).click();

    const ctx = await browser.newContext({ ...devices["Pixel 7"] });
    await ctx.addInitScript(SEEN);
    const phone = await ctx.newPage();
    await phone.goto(`/carrete/${code}?modo=celular`);
    await phone.getByLabel("Nombre o apodo").fill("Ana");
    await phone.getByRole("button", { name: "Entrar a la sala" }).click();
    await expect(phone.getByRole("heading", { name: "Ana" })).toBeVisible();
    await audit(phone, "celular en sala");

    await page.goto(`/carrete/tv?code=${code}`);
    await audit(page, "tv");
    await ctx.close();
  });
});
