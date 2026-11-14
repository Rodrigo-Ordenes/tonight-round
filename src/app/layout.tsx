import type { Metadata, Viewport } from "next";
import { Archivo, Doto, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import DisclaimerModal from "@/components/ui/DisclaimerModal";
import { INTRO_GATE_SCRIPT } from "@/lib/introGate";

// Títulos: grotesca técnica con eje de ancho (se usa algo expandida). Cifras grandes y el código de sala: matriz de
// puntos, como un letrero LED (solo ahí: es el gesto audaz de la identidad).
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
const led = Doto({ subsets: ["latin"], variable: "--font-led", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Tonight — el copiloto de tu carrete",
  description:
    "Arma la previa, prepara tragos, juega con la TV y los celulares, pon la música y divide la cuenta. Gratis y sin cuentas.",
  applicationName: "Tonight",
  manifest: "/manifest.webmanifest",
  // URL pública para las vistas previas al compartir (OG). En Vercel se deduce sola.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3100")
  ),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tonight",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // En Android el teclado achica el viewport (igual que iOS): los campos fijos abajo no quedan tapados
  interactiveWidget: "resizes-content",
  themeColor: "#090A0D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: el script del <head> puede marcar data-intro antes de hidratar
    <html lang="es" className={`dark ${display.variable} ${sans.variable} ${mono.variable} ${led.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      <body className="bg-night-950 text-slate-100 font-sans antialiased overflow-x-hidden">
        <AppShell>{children}</AppShell>
        <DisclaimerModal />
      </body>
    </html>
  );
}
