const { securityHeaders } = require("./src/lib/securityHeaders.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Paquete autónomo (server.js + dependencias mínimas) para subirlo a un hosting Node sin instalar nada allá
  output: "standalone",
  poweredByHeader: false,
  // La app no usa next/image: se apaga el optimizador para no exponerlo
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
