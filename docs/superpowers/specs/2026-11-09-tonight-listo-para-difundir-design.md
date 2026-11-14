# Tonight lista para difundirse — diseño

Aprobado el 2026-11-09, con la opción A de privacidad. Origen: crítica completa de la plataforma (26/40 en usabilidad y seis críticos).

## Intención

Poder compartir `tonight.misitio.cl` con desconocidos sin exponer datos sensibles, sin que un nombre raro rompa la sala y con la acción principal al alcance durante el carrete.

**Objetivos:** cerrar seguridad y privacidad, corregir los críticos de usabilidad y accesibilidad, y migrar las pantallas antiguas.

**Fuera de alcance:** cuentas, pagos, rastreo, servicios externos de pago, WebSockets y rediseñar la identidad visual.

**Sería un fracaso si:** la sincronización pierde datos, la TV deja de estimar, una sala activa queda inservible, o la hora de volver a 0.00 se lee como permiso para manejar.

## Restricciones

- Gratis, sin login, en español, 4 países.
- Toda mutación de sala es una `CarreteAction` idempotente con merge y prueba.
- Producción: LiteSpeed + Node en cPanel; rama compilada `v2-release`. Nada se compila ni instala allá.
- Sin commit, push, `release:v2` ni cambios en cPanel sin autorización explícita. Cada fase en commits propios.

## Enfoques de privacidad

| Opción | Compromiso | Decisión |
| --- | --- | --- |
| A. Factor en vez de peso y sexo | Migración y error de estimación de ~2 % | **Elegida** |
| B. Solo código largo | Quien tenga el código sigue viendo peso y sexo | Descartada: no cumple el objetivo |
| C. Cada celular publica su g/l | Reescribe sincronización, TV y agregar invitados | Descartada: costo alto |

## Fase 1: mitigación

- `images.unoptimized`; si `/_next/image` sigue procesando, bloquearlo.
- Cabeceras: HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y CSP.
- La CSP mantiene `script-src 'unsafe-inline'` (y `style-src 'unsafe-inline'`): los nonces obligarían a renderizar todo dinámicamente. Excepción documentada. `frame-src` permite solo Spotify.
- HTTPS: interruptor «Force HTTPS Redirect» de cPanel, a cargo de la persona dueña de la cuenta. No se hace en la app para evitar redirecciones infinitas.
- Caché del HTML: comprobar si `s-maxage` es efectivo; si hace falta, documentar un ajuste en `.htaccess`.

## Fase 2: API y datos

**Validación** en `normalizeParticipant` y el reductor: nombre ≤ 30, factor acotado, montos y textos con tope.

**Límites**, en disco y compartidos entre procesos, por IP (entrada derecha de `X-Forwarded-For`; sin ella, un balde común):
- crear salas;
- buscar códigos inexistentes (404);
- escrituras.

Leer una sala existente **no** se limita: diez celulares en un WiFi comparten IP y consultan cada 700 ms.

**Capacidad en disco:** máximo 2.000 salas y 200 MB.

**Códigos:** los nuevos tienen 6 caracteres; `CODE_RE` acepta 4 o 6 hasta que venzan los antiguos.

**Privacidad (opción A):**
- `Participant` publica `bodyFactor`: litros de distribución (`r × kg`) redondeados a 2 L. Se eliminan `weightKg` y `gender` de lo que viaja y se guarda en el servidor.
- Peso y sexo quedan en el celular para rellenar el formulario. Quien agrega a un invitado los escribe y solo viaja el factor.
- `normalizeParticipant` convierte salas antiguas a `bodyFactor` y borra los campos crudos, de modo que ni un cliente viejo ni una siembra los reintroducen.
- La interfaz deja de mostrar peso y sexo de otras personas.
- Los tragos siguen visibles en la sala: Cuentas y Wrapped los necesitan.

**Copy:** reemplazar «Nada sale de esta sala» por qué se guarda, dónde y por cuánto tiempo.

**Actualización** en commit aparte: Next 15.5.29 y React 19, `params` asíncronos, sin `swcMinify`; verificar standalone, `app.js` y OG.

## Fase 3: usabilidad y accesibilidad

- Barra fija sobre el dock: «+1 último trago», selector y «+1 agua», con safe-area.
- Dato principal: «Vuelves a 0.00 cerca de las HH:MM» junto a «no sirve para decidir si manejar». Los g/l quedan secundarios.
- Sala dividida en «Ahora» y «Más» (link de pago, canción, confesión).
- Un solo aviso de agua; aviso de edad corto para invitados por QR.
- Conductor que tomó: texto e ícono en TV, panel y Monstruómetro. Conductor sobrio sin barra llena.
- Sin desborde a 320, 375 y 1440 px con nombres sin espacios, incluido `/armar`.
- Modal único sobre `<dialog>` nativo para los 7 modales. El aviso de edad no se cierra con Escape.
- Enlace de salto, foco visible y objetivos de 44 px.
- Deshacer de 5 s en gastos e ítems: retrasa el borrado porque las marcas de borrado son permanentes.

## Fase 4: pantallas antiguas

- Migrar Piscolómetro, Tiempo, Mitos, Picante y `SplitBill` al sistema actual.
- Borrar lo que no se usa: `ConfessionsGame`, `NeonCard`, `CarreteCalculator`, `RandomGameTrigger`, `SplitBillCountry`, `WhatsAppShareButton`.
- Eliminar `transition-all`; las barras animan `transform`. Los degradados del medidor se conservan porque representan el líquido.
- Ícono de auto para el conductor en vez de corona.
- TV: ningún texto funcional bajo 24 px.
- `/seguridad`: solo limpieza de `transition-all`.
- Crear `PRODUCT.md` y `DESIGN.md`.

## Decisiones del constructor

- Valores exactos de los límites por IP.
- Cómo se presenta el selector de trago.
- Redondeo final del factor, si las pruebas muestran un error mayor a ~2 % en pesos habituales.
