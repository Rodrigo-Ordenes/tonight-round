# Actualizar Tonight en V2 Networks (la página que ya está corriendo)

La app de `https://tonight.misitio.cl` **no lee `main`**: lee la rama `v2-release`, que trae la app ya compilada
(el hosting no compila). Cada actualización tiene una parte en el computador y unos clics en cPanel.

Para saber qué versión está corriendo, abre `https://tonight.misitio.cl/version.txt`: muestra el commit publicado y la
fecha de compilación. Si no existe o muestra un commit anterior, la versión nueva todavía no está arriba.

---

## Parte A: en el computador (o pídeselo a Claude)

Con los cambios ya en git (commit hecho):

```bash
npm run release:v2
```

Compila, corre las pruebas y sube la versión a `v2-release`. Termina con «Publicado <commit> en v2-release». Anota ese
commit: es el que debe aparecer después en `/version.txt`.

---

## Parte B: en cPanel

### B1. Traer la versión nueva

1. **Archivos → Git Version Control**.
2. En el repositorio `tonight` → **Manage**.
3. Pestaña **Basic Information**: confirma que **Checked-Out Branch** sea `v2-release`.
4. Pestaña **Pull or Deploy** → **Update from Remote**. Debe aparecer el commit nuevo en «HEAD Commit».

### B2. Reiniciar la app

1. **Software → Setup Node.js App**.
2. En la app `tonight.misitio.cl` → **Restart**.
3. Abre `https://tonight.misitio.cl/version.txt`. Si muestra el commit nuevo, listo: pasa a la Parte C.

> Desde la versión con reinicio automático, la app además se reinicia sola hasta 30 s después de traer una versión
> nueva. El Restart queda como respaldo.

**No uses «Run NPM Install»**: la rama ya trae sus dependencias y ese botón puede romper la app.

### B3. Si sigue la versión anterior (o la página sale sin estilos)

Significa que el proceso viejo quedó vivo: atiende con la versión anterior, que pide archivos que ya no existen.
Prueba en este orden y revisa `/version.txt` después de cada paso:

1. **Detener y arrancar:** en Setup Node.js App → **Stop App**, espera 15 s → **Start App**.
2. **Archivo de reinicio de LiteSpeed:**
   - **Archivos → Administrador de archivos** → carpeta `tonight-app`.
   - Si no existe la carpeta `tmp`, créala. Dentro, crea el archivo `restart.txt` (o ábrelo, escribe una letra y
     **Guardar**: lo que cuenta es la fecha de guardado).
   - Abre la página una vez, espera 10 s y recarga.
3. **Recrear el entorno de Node:** en Setup Node.js App → lápiz (editar) → cambia **Node.js version** a otra (por
   ejemplo 22.x) → **Save**; luego vuelve a **20.x** → **Save** → **Restart**. Esto corta todos los procesos.
4. **Con Terminal de cPanel** (si tu plan la muestra; es una sola línea):

   ```bash
   pkill -u "$USER" -f "server/server.js"; mkdir -p ~/tonight-app/tmp && touch ~/tonight-app/tmp/restart.txt
   ```

5. **Si nada funciona:** revisa `tonight-app/stderr.log` en el Administrador de archivos y escribe a soporte de
   V2 Networks: «Tengo una app Node.js en `tonight-app` que no se reinicia; ¿pueden terminar sus procesos lsnode?».

---

## Parte C: comprobar que todo funciona

- [ ] `https://tonight.misitio.cl/version.txt` muestra el commit nuevo.
- [ ] La portada tiene estilos (fondo oscuro, logo de brindis en neón) y dice «Código corto + QR para la TV».
- [ ] Recarga forzada (Ctrl+F5, o Cmd+Shift+R en Mac). En el celular, cierra la pestaña y ábrela de nuevo.
- [ ] La intro «La ronda» aparece la primera vez; «Ver la ronda» en el inicio la repite.
- [ ] Crea una sala, únete desde otro celular y abre el Modo TV: el QR apunta a `https://tonight.misitio.cl`.
- [ ] En Música, pega un link de YouTube: se reproduce (por el dominio sí; por una IP, YouTube lo bloquea).

---

## Configuración que no se toca

| En cPanel | Valor |
| --- | --- |
| Git Version Control → Repository Path | `tonight-app` |
| Checked-Out Branch | `v2-release` |
| Setup Node.js App → Node.js version | 20.x (mínimo 18.17) |
| Application mode | Production |
| Application root | `tonight-app` |
| Application URL | `tonight.misitio.cl` |
| Application startup file | `app.js` |

Debe haber **una sola** app de Tonight en Setup Node.js App.

## Buenas prácticas

- Publica cuando no haya salas activas: una TV o celular con la versión anterior muestra datos inválidos hasta recargar.
- Las salas no se pierden: viven en `~/tonight-data`, fuera de la carpeta de la app.
- La tabla de síntomas completa está en [despliegue-v2networks.md](despliegue-v2networks.md#si-algo-falla).

## Volver a la versión anterior

En el computador: `git revert` del cambio en la rama de trabajo, `npm run release:v2`, y repetir la Parte B.
