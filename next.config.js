/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Paquete autónomo (server.js + dependencias mínimas) para subirlo a un hosting Node sin instalar nada allá
  output: "standalone",
  poweredByHeader: false,
};

module.exports = nextConfig;
