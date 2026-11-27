import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// El motor V14 (src/components/world) en su laboratorio: el proceso entero —llegar, elegir, acercarse, usar y volver—
// en el nivel 0 (el SectionStage de hoy) y en el 3D (nivel 2). El laboratorio solo existe si el servidor corre con
// TONIGHT_LABORATORIO=1; si no, estas pruebas se saltan.

const prep = (nivel: string) => {
  localStorage.setItem("tonight_disclaimer_ack", "true");
  localStorage.setItem("tonight_intro_seen", "1");
  localStorage.setItem("tonight_mundo_nivel", nivel);
};

async function open(page: Page, nivel: "0" | "2", path = "/laboratorio") {
  await page.addInitScript(prep, nivel);
  await page.goto(path);
  if (nivel === "2") {
    const gl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
    test.skip(!gl, "Este navegador no tiene WebGL 2");
  }
  await expect(page.locator(`html[data-mundo-nivel="${nivel}"]`)).toHaveCount(1, { timeout: 20_000 });
}

const caja = (page: Page, name: RegExp) => page.getByRole("button", { name });
const focusInTool = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[data-world-tool="marco"]'));

test.beforeEach(async ({ request }, info) => {
  // Una corrida basta: el caso del celular fija su propio tamaño de pantalla
  test.skip(info.project.name !== "escritorio", "El motor se prueba en el proyecto de escritorio");
  const res = await request.get("/laboratorio");
  test.skip(res.status() === 404, "Laboratorio apagado: levanta el servidor con TONIGHT_LABORATORIO=1");
});

test.describe("mundo · nivel 0 (SectionStage de hoy)", () => {
  test("llegar, elegir y volver con el botón atrás", async ({ page }) => {
    await open(page, "0");
    await expect(page.getByRole("heading", { level: 1, name: /El laboratorio/ })).toBeVisible();
    await expect(caja(page, /Caja azul/)).toHaveCount(1);
    await caja(page, /Caja azul/).click();
    await page.waitForURL(/\/laboratorio\?ver=azul$/);
    await page.getByLabel("Nota").fill("hola");
    await page.goBack();
    await page.waitForURL(/\/laboratorio$/);
    await expect(page.getByLabel("Nota")).toHaveCount(0);
  });
});

test.describe("mundo · nivel 2 (3D)", () => {
  test("el proceso entero, con un solo botón por opción en cada paso", async ({ page }) => {
    await open(page, "2");
    await expect(page.getByRole("heading", { level: 1, name: /El laboratorio/ })).toBeAttached();
    for (const n of [/Caja azul/, /Caja morada/, /Caja menta/]) await expect(caja(page, n)).toHaveCount(1);
    await expect(page.getByRole("link", { name: /La mesa/ })).toHaveCount(1);

    await caja(page, /Caja azul/).click();
    await page.waitForURL(/\/laboratorio\?ver=azul$/);
    const tool = page.getByRole("region", { name: "Caja azul" });
    await expect(tool).toBeVisible();
    await expect.poll(() => focusInTool(page)).toBe(true);
    for (const n of [/Caja azul/, /Caja morada/, /Caja menta/]) await expect(caja(page, n)).toHaveCount(1);
    await page.getByLabel("Nota").fill("hola");

    // Pasar a una hermana reemplaza; Escape vuelve al centro y el foco regresa al objeto
    await caja(page, /Caja morada/).click();
    await page.waitForURL(/\/laboratorio\?ver=morado$/);
    await expect(page.getByRole("region", { name: "Caja morada" })).toBeVisible();
    await expect.poll(() => focusInTool(page)).toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForURL(/\/laboratorio$/);
    await expect(page.locator("[data-world-tool][role=region]:not([inert])")).toHaveCount(0);
    await expect(caja(page, /Caja morada/)).toBeFocused();

    // «Volver» hace lo mismo
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    await page.getByRole("button", { name: "Volver" }).click();
    await page.waitForURL(/\/laboratorio$/);
  });

  test("el botón atrás del navegador cierra la herramienta", async ({ page }) => {
    await open(page, "2");
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    await page.goBack();
    await page.waitForURL(/\/laboratorio$/);
    await expect(page.locator("[data-world-tool][role=region]:not([inert])")).toHaveCount(0);
  });

  test("enlace directo y Escape: vuelve al centro sin dejar una entrada de más", async ({ page }) => {
    await open(page, "2", "/laboratorio?ver=morado");
    await expect(page.getByRole("region", { name: "Caja morada" })).toBeVisible();
    const before = await page.evaluate(() => history.length);
    await expect.poll(() => focusInTool(page)).toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForURL(/\/laboratorio$/);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("un ?ver= desconocido deja en el centro", async ({ page }) => {
    await open(page, "2", "/laboratorio?ver=xyz");
    await expect(page.locator("[data-world-tool][role=region]:not([inert])")).toHaveCount(0);
    await expect(caja(page, /Caja azul/)).toHaveCount(1);
  });

  test("Escape en un diálogo de la herramienta cierra solo el diálogo", async ({ page }) => {
    await open(page, "2");
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    await page.getByRole("button", { name: "Ver detalle" }).click();
    const dialog = page.getByRole("dialog", { name: "Detalle de la caja" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/laboratorio\?ver=azul$/);
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
  });

  test("el lienzo sigue vivo al pasar a otra ruta del apartado", async ({ page }) => {
    await open(page, "2");
    await page.evaluate(() => {
      (document.querySelector("[data-world-canvas] canvas") as HTMLCanvasElement).dataset.marca = "1";
    });
    await page.getByRole("link", { name: /La mesa/ }).click();
    await page.waitForURL(/\/laboratorio\/mesa$/);
    await expect(page.getByRole("region", { name: "La mesa" })).toBeVisible();
    await expect(page.locator('[data-world-canvas] canvas[data-marca="1"]')).toHaveCount(1);
  });

  test("bajar de nivel con una herramienta abierta no borra lo escrito (espera a que se cierre)", async ({ page }) => {
    await open(page, "2");
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    // La herramienta está inerte hasta que llega la cámara: se escribe cuando ya tiene el foco
    await expect.poll(() => focusInTool(page)).toBe(true);
    await page.getByLabel("Nota").fill("hola");
    await page.evaluate(() => (window as unknown as { __mundo: { setLevel: (l: number) => void } }).__mundo.setLevel(0));
    await page.waitForTimeout(400);
    await expect(page.locator('html[data-mundo-nivel="2"]')).toHaveCount(1);
    await expect(page.getByLabel("Nota")).toHaveValue("hola");
    await page.getByLabel("Nota").press("Escape");
    await page.waitForURL(/\/laboratorio$/);
    await expect(page.locator('html[data-mundo-nivel="0"]')).toHaveCount(1);
  });

  test("a 375×812 todas las opciones quedan dentro de la pantalla", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, "2");
    await expect(page.locator('[data-modo="escena"][data-listo="1"]')).toHaveCount(3);
    for (const el of await page.locator(".world-object").all()) {
      const b = (await el.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(375);
      expect(b.y + b.height).toBeLessThanOrEqual(812);
    }
  });

  test("el viaje de la cámara dura lo pedido; con movimiento reducido es un fundido corto", async ({ page }) => {
    await open(page, "2");
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => Number(document.documentElement.dataset.viaje ?? 0))).toBeGreaterThan(0);
    const viaje = await page.evaluate(() => Number(document.documentElement.dataset.viaje));
    console.log(`viaje de la cámara: ${viaje} ms`);
    expect(viaje).toBeLessThan(1500);

    await expect.poll(() => focusInTool(page)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.keyboard.press("Escape");
    await page.waitForURL(/\/laboratorio$/);
    await caja(page, /Caja morada/).click();
    await expect(page.getByRole("region", { name: "Caja morada" })).toBeVisible();
    await expect.poll(() => focusInTool(page)).toBe(true);
    const corto = await page.evaluate(() => Number(document.documentElement.dataset.viaje));
    console.log(`con movimiento reducido: ${corto} ms`);
    expect(corto).toBeLessThan(500);
  });

  test("Axe sin violaciones serias en el centro y con la herramienta abierta", async ({ page }) => {
    await open(page, "2");
    const audit = async (label: string) => {
      await page.waitForTimeout(900);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("iframe").analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), label).toEqual([]);
    };
    await audit("centro");
    await caja(page, /Caja azul/).click();
    await expect(page.getByRole("region", { name: "Caja azul" })).toBeVisible();
    await audit("herramienta abierta");
  });
});
