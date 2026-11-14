# Actualizar Tonight en V2 Networks (página que ya está corriendo)

La app de `https://tonight.misitio.cl` no lee `main`: lee la rama `v2-release`, que trae la app ya compilada. Por eso
cada actualización tiene una parte en el computador y dos clics en cPanel.

## En el computador (o pídeselo a Claude)

Con los cambios ya en git (commit hecho):

```bash
npm run release:v2
```

Compila y sube la versión a `v2-release`. Termina con «Publicado <commit> en v2-release». Si dice «Hay cambios sin
commit», primero haz commit.

## En cPanel (2 clics)

1. **Archivos → Git Version Control → Manage** (repositorio `tonight`) → pestaña **Pull or Deploy** →
   **Update from Remote**. La rama activa debe seguir siendo `v2-release`.
2. **Software → Setup Node.js App** → en la app `tonight.misitio.cl` → **Restart**.

No uses «Run NPM Install»: la rama ya trae sus dependencias.

## Comprobar

- Abre `https://tonight.misitio.cl` con recarga forzada (Ctrl+F5, o Cmd+Shift+R en Mac); en el celular, cierra la
  pestaña y ábrela de nuevo.
- La intro se ve una vez por navegador; «Ver la ronda» en el inicio la repite.
- Crea una sala, únete desde otro celular y abre el Modo TV.
- Pega un link de YouTube en Música: por el dominio se reproduce (por una IP, YouTube lo bloquea).

## Buenas prácticas

- Publica cuando no haya salas activas: una TV o celular con la versión anterior muestra datos inválidos hasta recargar.
- Las salas no se pierden: viven en `~/tonight-data`.
- Si algo falla, la tabla de síntomas está en [despliegue-v2networks.md](despliegue-v2networks.md#si-algo-falla).

## Volver a la versión anterior

En cPanel → Git Version Control → Manage → pestaña **Basic Information** se ve el commit actual. Para volver atrás sin
Terminal, en el computador: `git revert` del cambio en la rama de trabajo, `npm run release:v2`, y repetir los dos clics.
