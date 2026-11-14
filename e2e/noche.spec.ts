import { devices, expect, test, type Browser, type Page } from "@playwright/test";

// Una noche completa sobre el build de producción: crear sala, invitar, unirse desde dos celulares, jugar una
// ronda de «Yo nunca», votar en secreto y revelar. Más las cabeceras de seguridad y la intro «La ronda».

const ACK = () => {
  localStorage.setItem("tonight_disclaimer_ack", "true");
};
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
  await expect(page.getByLabel("Nombre o apodo")).toHaveCount(0);
  // La vista del celular tiene que quedar en pie (no la pantalla de error)
  await expect(page.getByRole("heading", { name: name })).toBeVisible();
  await expect(page.getByText("Se nos cayó el vaso")).toHaveCount(0);
  // Las píldoras de las pestañas visibles tienen que quedar ubicadas (aparecen después de pedir el nombre)
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".sliding-indicator")]
          .filter((e) => e.parentElement && e.parentElement.getBoundingClientRect().width > 0 && e.parentElement.querySelector('[aria-selected="true"]'))
          .every((e) => e.getBoundingClientRect().width > 0)
      )
    )
    .toBe(true);
  return page;
}

test.describe("la noche", () => {
  test("crear sala, invitar, unirse, votar y revelar", async ({ page, browser }, info) => {
    test.skip(info.project.name !== "escritorio", "El anfitrión usa la mesa; los celulares se crean aparte");
    await page.addInitScript(SEEN);
    await page.goto("/");
    await page.getByRole("button", { name: /Crear sala/ }).click();
    await page.waitForURL(/\/carrete\/[A-Z0-9]{6}\?invitar=1/);
    const code = new URL(page.url()).pathname.split("/").pop()!;

    // Hoja de invitación: código, QR y enlace correcto
    const sheet = page.getByRole("dialog");
    await expect(sheet).toContainText("Sala lista");
    await expect(sheet.getByRole("img")).toBeVisible();
    await expect(sheet).toHaveAttribute("open", "");
    await sheet.getByRole("button", { name: "Ahora no" }).click();
    await expect(page).toHaveURL(new RegExp(`/carrete/${code}$`));

    const url = `/carrete/${code}?modo=celular`;
    const ana = await phone(browser, url, "Ana");
    const beto = await phone(browser, url, "Beto");

    // La mesa espera a ver a las dos personas (llegan por la sincronización) y lanza la ronda
    await expect(page.getByText("Carrete en vivo · 2 personas")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Yo nunca/ }).first().click();
    for (const [p, choice] of [
      [ana, /Yo sí/],
      [beto, /Nunca/],
    ] as const) {
      const option = p.getByRole("button", { name: choice });
      await expect(option).toBeVisible({ timeout: 15_000 });
      await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
    }

    // Revelar cuando llegaron los votos
    const reveal = page.getByRole("button", { name: /Revelar/ });
    await expect(reveal).toBeEnabled({ timeout: 15_000 });
    await reveal.click();
    await expect(page.getByRole("button", { name: /Otra ronda/ })).toBeVisible();
    await expect(ana.getByRole("button", { name: /Yo sí/ })).toHaveCount(0, { timeout: 15_000 });

    await ana.context().close();
    await beto.context().close();
  });
});

test.describe("Mímica", () => {
  test("la palabra solo aparece en el celular de quien actúa", async ({ page, browser }, info) => {
    test.skip(info.project.name !== "escritorio", "La mesa usa escritorio; los celulares se crean aparte");
    await page.addInitScript(SEEN);
    await page.goto("/");
    await page.getByRole("button", { name: /Crear sala/ }).click();
    await page.waitForURL(/\/carrete\/[A-Z0-9]{6}\?invitar=1/);
    const code = new URL(page.url()).pathname.split("/").pop()!;
    await page.getByRole("button", { name: "Ahora no" }).click();
    const url = `/carrete/${code}?modo=celular`;
    const phones = [await phone(browser, url, "Ana"), await phone(browser, url, "Beto"), await phone(browser, url, "Caro")];

    await expect(page.getByText("Carrete en vivo · 3 personas")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Mímica/ }).first().click();

    // Solo lo visible: en el celular, el panel lateral de escritorio queda oculto en el DOM
    const actorBanner = (p: Page) => p.getByText("Te toca actuar, sin hablar").filter({ visible: true });
    await expect.poll(async () => (await Promise.all(phones.map((p) => actorBanner(p).count()))).reduce((a, b) => a + b, 0), { timeout: 15_000 }).toBe(1);
    const counts = await Promise.all(phones.map((p) => actorBanner(p).count()));
    const actor = phones[counts.indexOf(1)];
    const word = (await actorBanner(actor).locator("xpath=following-sibling::p[1]").innerText()).trim();
    expect(word.length).toBeGreaterThan(1);

    for (const p of phones.filter((x) => x !== actor)) {
      await expect(p.getByText("Adivina en voz alta").filter({ visible: true })).toBeVisible();
      await expect(p.getByText(word, { exact: true })).toHaveCount(0);
    }
    const tv = await page.context().newPage();
    await tv.goto(`/carrete/tv?code=${code}`);
    await expect(tv.getByText(/actúa/).first()).toBeVisible({ timeout: 15_000 });
    await expect(tv.getByText(word, { exact: true })).toHaveCount(0);

    for (const p of phones) await p.context().close();
  });
});

test.describe("seguridad", () => {
  test("cabeceras de seguridad en la portada", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("el optimizador de imágenes está apagado (no sirve de proxy)", async ({ request }) => {
    const res = await request.get("/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75");
    expect(res.status()).toBe(404);
  });
});

test.describe("intro «La ronda»", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(ACK);
  });

  test("se puede saltar y deja al visitante en el inicio", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Saltar intro/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    expect(await page.evaluate(() => localStorage.getItem("tonight_intro_seen"))).toBe("1");
  });

  test("la página no baja sola a mitad de la intro", async ({ page }) => {
    await page.goto("/");
    const y = await page.evaluate(() => {
      const s = document.querySelector(".pour-intro") as HTMLElement;
      const top = s.getBoundingClientRect().top + scrollY;
      const target = Math.round(top + 0.45 * (s.offsetHeight - innerHeight));
      scrollTo(0, target);
      return target;
    });
    await page.waitForTimeout(1500);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThanOrEqual(2);
  });

  test("aunque se llegue de un salto, el final queda listo y crea la sala", async ({ page }) => {
    await page.goto("/");
    const intro = page.locator(".pour-intro");
    // Antes del final, la acción está inerte (no recibe toques ni foco)
    await expect(intro.locator("[inert]")).toHaveCount(1);
    await page.evaluate(() => {
      const s = document.querySelector(".pour-intro") as HTMLElement;
      scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight - innerHeight);
    });
    await expect(intro.locator("[inert]")).toHaveCount(0);
    await intro.getByRole("button", { name: "Crear sala" }).click();
    await page.waitForURL(/\/carrete\/[A-Z0-9]{6}\?invitar=1/);
  });

  test("al cargar se ve la barra con el logo, sin que la tape otra sección", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const covered = await page.evaluate(() => {
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return !el?.closest(".pour-intro");
    });
    expect(covered).toBe(false);
    // A mitad de la intro, el escenario sigue siendo la intro (no el recorrido de módulos)
    await page.evaluate(() => {
      const s = document.querySelector(".pour-intro") as HTMLElement;
      scrollTo(0, s.getBoundingClientRect().top + scrollY + 0.5 * (s.offsetHeight - innerHeight));
    });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => !!document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest(".pour-intro"))).toBe(true);
  });

  test("ya vista, no vuelve a aparecer", async ({ page }) => {
    await page.addInitScript(SEEN);
    await page.goto("/");
    await expect(page.locator(".pour-intro")).toHaveCount(0);
  });
});

test.describe("portada en escritorio", () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "escritorio", "El recorrido de módulos y el cajón son de escritorio");
    await page.addInitScript(SEEN);
  });

  test("las flechas del recorrido llegan al quinto módulo", async ({ page }) => {
    await page.goto("/");
    const next = page.getByRole("button", { name: "Módulo siguiente" });
    await next.scrollIntoViewIfNeeded();
    const sectionTop = () => page.evaluate(() => document.querySelector("[data-track-section]")!.getBoundingClientRect().top);
    for (let i = 0; i < 4; i++) {
      await next.click();
      await page.waitForTimeout(1300);
      // A mitad del recorrido la sección queda fija arriba (antes se iba con el scroll y los módulos no se alcanzaban)
      if (i === 1) {
        expect(Math.abs(await sectionTop())).toBeLessThanOrEqual(2);
        await expect(page.locator("[data-track] a[href='/juegos']")).toBeInViewport();
      }
    }
    await expect(page.locator("[data-track-count]")).toHaveText("05");
    await expect(page.locator("[data-track] a[href='/dividir']")).toBeInViewport();
  });

  test("«Ver la ronda» vuelve a mostrar la intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pour-intro")).toHaveCount(0);
    await page.getByRole("button", { name: "Ver la ronda" }).click();
    await expect(page.locator(".pour-intro")).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  });

  test("el panel en vivo se abre como cajón y no ocupa una columna", async ({ page }) => {
    await page.goto("/bar");
    await expect(page.getByRole("dialog", { name: "Sala en vivo" })).toHaveCount(0);
    await page.getByRole("button", { name: /Abrir panel en vivo/ }).click();
    const drawer = page.getByRole("dialog", { name: "Sala en vivo" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  });
});
