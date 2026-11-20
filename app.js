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

// Versión nueva o archivo de reinicio: cada 15 s compara BUILD_ID y tmp/restart.txt con los valores al arrancar.
// Si cambia BUILD_ID, si se borra la carpeta (now === null) o si se toca tmp/restart.txt, el proceso termina solo
// para que LiteSpeed levante la instancia nueva en la siguiente visita.
const BUILD_ID_FILE = path.join(__dirname, "server", ".next", "BUILD_ID");
const RESTART_FILE = path.join(__dirname, "tmp", "restart.txt");
const readBuildId = () => {
  try {
    return fs.readFileSync(BUILD_ID_FILE, "utf8").trim();
  } catch {
    return null;
  }
};
const readRestartMtime = () => {
  try {
    return fs.statSync(RESTART_FILE).mtimeMs;
  } catch {
    return 0;
  }
};
const startedWith = readBuildId();
const startedRestartMtime = readRestartMtime();
setInterval(() => {
  const now = readBuildId();
  const restartMtime = readRestartMtime();
  if ((startedWith && now !== startedWith) || (restartMtime > 0 && restartMtime !== startedRestartMtime)) {
    console.log(`Tonight: cambio detectado (${startedWith} → ${now ?? "eliminado"}), reiniciando`);
    process.exit(0);
  }
}, 15_000).unref();

// El servidor va en una subcarpeta: el selector de Node de CloudLinux no admite node_modules real en la raíz.
require("./server/server.js");
