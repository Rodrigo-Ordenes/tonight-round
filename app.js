/*
 * Archivo de inicio para "Setup Node.js App" (cPanel + LiteSpeed) de V2 Networks.
 * El cargador del hosting intercepta el listen, así que el puerto lo pone él.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.NODE_ENV = "production";
// En hosting compartido HOSTNAME trae el nombre de la máquina; Next lo usaría para escuchar.
process.env.HOSTNAME = "127.0.0.1";
// Fuera de la carpeta de la app: las salas sobreviven a reinicios y a subir una versión nueva.
process.env.CARRETE_DATA_DIR = process.env.CARRETE_DATA_DIR || path.join(os.homedir(), "tonight-data");

// Versión nueva sin reinicio: "Update from Remote" cambia los archivos, pero el proceso viejo seguía sirviendo páginas
// que piden archivos ya borrados (la página salía sin estilos). Cada 30 s se compara el BUILD_ID del disco con el
// que arrancó; si cambió, el proceso termina y el hosting levanta la versión nueva en la siguiente visita.
const BUILD_ID_FILE = path.join(__dirname, "server", ".next", "BUILD_ID");
const readBuildId = () => {
  try {
    return fs.readFileSync(BUILD_ID_FILE, "utf8").trim();
  } catch {
    return null;
  }
};
const startedWith = readBuildId();
setInterval(() => {
  const now = readBuildId();
  if (startedWith && now && now !== startedWith) {
    console.log(`Tonight: versión nueva (${startedWith} → ${now}), reiniciando`);
    process.exit(0);
  }
}, 30_000).unref();

// El servidor va en una subcarpeta: el selector de Node de CloudLinux no admite node_modules real en la raíz.
require("./server/server.js");
