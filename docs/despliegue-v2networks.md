# Publicar Tonight en V2 Networks

Destino: `https://tonight.misitio.cl`, plan Crecimiento (cPanel, 1,5 CPU, 3 GB).

Tonight es Next.js y necesita **Node.js**. Python 3.10.22 no se usa: esa versión aplica solo a «Setup Python App». El plan incluye ambos.

Todo se hace desde las pantallas de cPanel, sin Terminal. La rama `v2-release` del repositorio trae la app ya compilada.

## 1. Crear el subdominio

1. **Dominios** → **Crear un dominio nuevo** → `tonight.misitio.cl`.
2. Si el DNS de `misitio.cl` no está en V2 Networks, crea un registro `A` para `tonight` con la IP del hosting.
3. **SSL/TLS Status** → **Run AutoSSL**.

## 2. Clonar con Git Version Control

Hazlo antes de crear la app, porque cPanel exige una carpeta vacía. **Archivos** → **Git Version Control** → **Create**:

| Campo | Valor |
| --- | --- |
| Clone a Repository | activado |
| Clone URL | `https://github.com/Rodrigo-Ordenes/tonight-round.git` |
| Repository Path | `tonight-app` |
| Repository Name | `tonight` |

Luego, en **Manage** → **Pull or Deploy** / **Basic Information**, cambia **Checked-Out Branch** a `v2-release`. Deben quedar `app.js`, `package.json` y `server/`.

## 3. Crear la app

**Software** → **Setup Node.js App** → **Create Application**:

| Campo | Valor |
| --- | --- |
| Node.js version | 20.x (mínimo 18.17) |
| Application mode | Production |
| Application root | `tonight-app` |
| Application URL | `tonight.misitio.cl` |
| Application startup file | `app.js` |

Pulsa **Create** y después **Restart**. **No uses «Run NPM Install»**: la rama ya trae sus dependencias.

## 4. Comprobar

- Abre `https://tonight.misitio.cl`, crea una sala y únete desde otro celular.
- El QR de la TV debe apuntar al subdominio con `https`.
- Las salas se guardan solas en `~/tonight-data` y vencen a las 48 h sin actividad.

## Actualizar

1. En el computador de desarrollo, con los cambios ya en git: `npm run release:v2`. Publica la nueva versión en `v2-release`.
2. cPanel → **Git Version Control** → **Manage** → **Pull or Deploy** → **Update from Remote**.
3. **Setup Node.js App** → **Restart**.

Las salas no se pierden porque están en `~/tonight-data`. Si cambia el subdominio, publica con `SITE_URL=https://otro.misitio.cl npm run release:v2`.

## Si algo falla

| Síntoma | Qué revisar |
| --- | --- |
| Error 503 o «Incomplete response» | Versión de Node ≥ 18.17 y archivo de inicio `app.js`. Revisa `stderr.log` en `tonight-app`. |
| La página carga sin estilos | Falta `server/.next/static`: revisa que la rama activa sea `v2-release`. |
| Mensaje sobre `node_modules` | No debe existir en la raíz de `tonight-app`; solo dentro de `server/`. |
| Las salas dan error 503 | Permisos de escritura en `~/tonight-data`. Se puede cambiar con la variable `CARRETE_DATA_DIR`. |

Opcional: con `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en las variables de la app, las salas usan Redis en vez de archivos.
