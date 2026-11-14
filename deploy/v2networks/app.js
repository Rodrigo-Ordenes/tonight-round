/*
 * Archivo de inicio para "Setup Node.js App" (cPanel + LiteSpeed) de V2 Networks.
 * El cargador del hosting intercepta el listen, así que el puerto lo pone él.
 */
const os = require("os");
const path = require("path");

process.env.NODE_ENV = "production";
// En hosting compartido HOSTNAME trae el nombre de la máquina; Next lo usaría para escuchar.
process.env.HOSTNAME = "127.0.0.1";
// Fuera de la carpeta de la app: las salas sobreviven a reinicios y a subir una versión nueva.
process.env.CARRETE_DATA_DIR = process.env.CARRETE_DATA_DIR || path.join(os.homedir(), "tonight-data");

// El servidor va en una subcarpeta: el selector de Node de CloudLinux no admite node_modules real en la raíz.
require("./server/server.js");
