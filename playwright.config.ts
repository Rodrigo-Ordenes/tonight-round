import { defineConfig, devices } from "@playwright/test";

// E2E sobre el build de producción (scripts/e2e-server.sh). En local reutiliza un servidor ya levantado.
const PORT = Number(process.env.E2E_PORT ?? 3105);

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    // En local se puede apuntar a un Chromium ya instalado (CHROME_BIN); en CI se usa el de Playwright
    launchOptions: process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {},
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `PORT=${PORT} bash scripts/e2e-server.sh`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
