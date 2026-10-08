# 🌙 Tonight / Copiloto del Carrete — Sistema Operativo Social Nocturno (V9 Master Blueprint) 🌐

Web application gratuita, ultra-rápida, mobile-first y optimizada para Smart TV sin muros de pago ni registros forzados. Transforma la clásica calculadora de insumos en una **plataforma social sincrónica para carretes, fiestas y reuniones en todo el mundo**.

> *"Todo lo que necesitas para organizar, gozar y cuidar la noche, en un solo lugar."*

---

## 🧭 Invariantes y Principios de Diseño

1. **Cero Fricción:** 100% gratuita, sin pantallas de login forzado, descargas obligatorias de tiendas ni muros de pago.
2. **Identidad Chilena Intacta (Default Cultural):** Preservación total del lore chileno (Piscola 70/30 y 60/40, lucas, CuentaRUT, BancoEstado, Ley Emilia y Ley de Tolerancia Cero), desacoplado limpiamente para coexistir con México 🇲🇽, EE.UU. 🇺🇸 y Japón 🇯🇵.
3. **Dark Mode OLED:** Paleta Obsidian (`#060911` / `#090d16`), tarjetas Midnight (`#0D1322`) y acentos neón calibrados (Violeta, Fucsia, Esmeralda, Ámbar y Rojo).
4. **Marco Legal Estricto y Educación:** Advertencias de tolerancia cero al volante. Los cálculos biológicos de Widmark son estrictamente educativos y **nunca** emiten un "visto bueno" o veredicto de aptitud para conducir.
5. **Scraping Batch Offline:** Los precios y canastas se consultan desde datos estáticos optimizados (`src/data/prices_cl.json`), garantizando disponibilidad y rapidez inmediata sin scraping frágil en el navegador.

---

## 🚀 Módulos y Arquitectura de Navegación

### 1. 🚪 Gateway de Entrada (`/`)
- **Aislamiento de Sesión:** Cada usuario inicia en un portal limpio sin arrastrar datos residuales de sesiones previas.
- **Creación de Carrete:** Generación instantánea de códigos alfanuméricos de 4 caracteres (ej. `PREV`, `LIT1`).
- **Unión por PIN:** Input táctil segmentado con auto-focus secuencial y transformación a mayúsculas.
- **Modo Solo / Planificador:** Acceso instantáneo a las calculadoras y simuladores sin necesidad de sincronizar con otros dispositivos.
- **Selector Dinámico de País:** Selector visual para alternar en cualquier momento entre Chile 🇨🇱, México 🇲🇽, EE.UU. 🇺🇸 y Japón 🇯🇵.

### 2. 📺 Carrete Sincrónico (`/carrete/[code]` & `/carrete/tv`)
- **Doble Perspectiva:**
  - **Modo Host / TV (`/carrete/[code]` o `/carrete/tv`):** Diseñado para Smart TVs, proyectores o iPads sobre la mesa. Muestra el código de carrete en alta resolución, QR proyectable, el **Monstruómetro** colectivo y el tablero de seguridad.
  - **Modo Celular (`/carrete/[code]?modo=celular`):** Interfaz táctil ergonómica con safe-areas (`100dvh`), targets mínimos de 48px, botón de consumo rápido ("+1 Trago"), envío de confesiones y confirmación de llegada segura.
- **Sincronización en Red con Fallback Offline:**
  - Endpoint de sincronización HTTP: `src/app/api/carrete/[code]/route.ts`. Actúa como bus de sincronización en memoria con resolución Last-Write-Wins (LWW) para permitir emparejar celulares y Smart TV en la misma red local o remota.
  - Fallback resiliente en `localStorage` bajo `carrete_[CODE]` para operación continua sin conexión.

### 3. 🧪 Monstruómetro Exacto (Monsters Inc. Canisters)
- **Visualización Tipo Contenedor de Sustos:** Cilindros con escala graduada, burbujas dinámicas y colorimetría reactiva (Verde Neón $\to$ Amarillo Ámbar $\to$ Rojo Crítico).
- **Métricas Científicas Rigurosas:**
  $$\text{Alcohol Puro (g)} = \text{Volumen (ml)} \times \frac{\text{ABV}}{100} \times 0.8$$
- **Estimación Educativa de Alcoholemia (BAC en g/l):** Basada en la fórmula de Widmark ajustada por sexo biológico y peso corporal.
- **Tanque Piloto 0.0%:** Contenedor exclusivo para el Conductor Designado, con advertencia roja inmediata en caso de registrar consumo de alcohol.
- **Banner de Halloween:** Banner reactivo temático con interruptor de activación para ambientación nocturna.

### 4. 🍸 Bar Visual Fusionado (`/bar`)
- **Vaso Interactivo SVG:** Renderiza dinámicamente capas de líquido coloreadas según los licores y mezcladores seleccionados.
- **Cálculo de Graduación Alcohólica (% ABV):** Ponderación exacta por volumen en tiempo real.
- **Veredicto Organoléptico:** Evaluador que clasifica la combinación en *Aprobado*, *Extraño* o *Peligro*.
- **Selector de Hielo:** Control de dilución y sugerencia de hielo en cubos.

### 5. 🛒 Planificador de Canasta & Delivery (`/armar`)
- **3 Perfiles de Carrete:** *Económico*, *Clásico* y *Premium / Mocktail*.
- **Comparador Multitienda:** Referencia de precios offline de retail (Líder, Jumbo, Botillería de barrio).
- **Delivery en 1 Clic:** Deep links inteligentes con búsqueda pre-cargada adaptados al país seleccionado (Rappi, PedidosYa, Uber Eats, Didi Food, Instacart).

### 6. 🎮 Game Studio Digital (`/juegos`)
- **💣 La Bomba:** Cronómetro dinámico con tensión visual y auditiva. Utiliza el algoritmo de **Fisher-Yates** para garantizar categorías no repetitivas.
- **🎯 Ruleta de Retos:** Ruleta interactiva con posibilidad de editar participantes y desafíos en vivo.
- **🤫 Yo Nunca:** Banco de afirmaciones con barajado aleatorio en un toque.
- **Atajos de Teclado:** Soporte para mandos a distancia y teclados numéricos en pantalla Smart TV.

### 7. 💸 Cobro y División de Gastos (`/dividir`)
- **Soporte Fintech Multi-País:**
  - 🇨🇱 **Chile:** BancoEstado CuentaRUT, MACH, Khipu.
  - 🇲🇽 **México:** Clave Interbancaria SPEI (CLABE 18 dígitos).
  - 🇺🇸 **EE.UU.:** Venmo, Zelle, Cash App.
  - 🇯🇵 **Japón:** PayPay, LINE Pay, Warikan (割り勘).
- **Copia a WhatsApp en 1 Clic:** Plantilla de mensaje lista para enviar con detalle exacto del cobro y datos de transferencia.

### 8. 🛡️ Seguridad Proactiva y Retorno Seguro (`/seguridad`)
- **Deep Links a Viaje Seguro:** Accesos inmediatos a Uber, Cabify, DiDi y Daikou (Japón).
- **Tablero "Llegué a Salvo":** Los asistentes confirman con un solo toque su llegada a casa para tranquilidad del grupo.
- **Protocolo Ley Emilia / Conductor Designado:** Recordatorio activo de las consecuencias legales y penales al conducir bajo la influencia del alcohol.

### 9. 🧠 Mitos Científicos (`/mitos`)
- Fichas interactivas basadas en farmacocinética y evidencia médica real (desmintiendo mitos populares como tomar café para bajar la borrachera o mezclar con bebidas energéticas).

---

## 🌍 Arquitectura de Internacionalización (i18n Dinámico)

Toda la terminología cultural, divisas, regulaciones de tránsito y métodos de pago están desacoplados a través de `src/config/locales/` y se consumen mediante el hook reactivo `useLocale()`:

| Parámetro | 🇨🇱 Chile | 🇲🇽 México | 🇺🇸 Estados Unidos | 🇯🇵 Japón |
| :--- | :--- | :--- | :--- | :--- |
| **Término Fiesta** | Carrete / Junta | Peda / Fiesta | Party / Pre-game | Nomikai (飲み会) |
| **Moneda** | CLP (\$) / *lucas* | MXN (\$) / *varos* | USD (\$) / *bucks* | JPY (¥) / *yenes* |
| **Tragos Típicos** | Piscola, Terremoto, Cerveza | Tequila, Michelada, Mezcal | Hard Seltzer, Craft IPA, Bourbon | Highball, Lemon Sour, Sake |
| **Límite Legal Alcoholemia** | 0.30 g/l (Tolerancia Cero) | 0.40 g/l ("El Torito") | 0.08% BAC (DUI) | 0.00 mg/l (Tolerancia Absoluta) |
| **Leyes de Tránsito** | Ley Emilia & Ley N° 20.580 | Reglamento de Tránsito CDMX | Implied Consent & DUI Laws | Ley de Tráfico Vial (Daikou) |
| **Fintech de Cobro** | CuentaRUT / MACH | SPEI CLABE (18 dígitos) | Venmo / Zelle / Cash App | PayPay / LINE Pay / Warikan |
| **Delivery Apps** | Rappi, PedidosYa, Uber Eats | Rappi, Uber Eats, Didi Food | Uber Eats, Instacart, DoorDash | Uber Eats Japan, Wolt, Demae-can |

---

## 📂 Estructura del Proyecto

```
Round/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout OLED, metadatos y viewport seguro
│   │   ├── page.tsx                   # Gateway principal y selector de carrete
│   │   ├── api/
│   │   │   └── carrete/[code]/route.ts# Bus de sincronización en servidor (GET/POST/PUT)
│   │   ├── carrete/
│   │   │   ├── page.tsx               # Redirección de fallback a Gateway
│   │   │   ├── tv/page.tsx            # Modo proyector / Smart TV
│   │   │   └── [code]/page.tsx        # Carrete sincrónico (TV vs Modo Celular)
│   │   ├── bar/page.tsx               # Bar Visual interactivo con vaso SVG
│   │   ├── armar/page.tsx             # Planificador de canasta y delivery
│   │   ├── dividir/page.tsx           # División de cuenta con fintech local
│   │   ├── juegos/page.tsx            # Game Studio (La Bomba, Ruleta, Yo Nunca)
│   │   ├── seguridad/page.tsx         # Retorno seguro y tablero de llegada
│   │   ├── mitos/page.tsx             # Mitos científicos de la fiesta
│   │   └── tiempo/page.tsx            # Calculadora de eliminación metabólica
│   ├── components/
│   │   ├── gateway/
│   │   │   └── CarreteGatewayModal.tsx# Modal de acceso, creación y PIN
│   │   ├── navigation/
│   │   │   ├── GlobalNavbar.tsx       # Navbar con retorno confiable y selector i18n
│   │   │   └── CountrySelector.tsx    # Selector de banderas interactivo
│   │   ├── bar/
│   │   │   └── VisualCocktailGlass.tsx# Vaso SVG con cálculo de ABV y veredicto
│   │   ├── monsters/
│   │   │   └── MonstersCanisterLeaderboard.tsx # Canisters Monsters Inc. y métricas exactas
│   │   ├── calculators/
│   │   │   ├── BasketOptimizer.tsx    # Canastas inteligente
│   │   │   ├── CarreteCalculator.tsx  # Calculadora unificada de consumo
│   │   │   ├── SplitBill.tsx          # Formulario bancario localizado
│   │   │   └── DeliveryTextExporter.tsx# Exportador de compras a WhatsApp
│   │   ├── games/
│   │   │   ├── TimeBombGame.tsx       # Juego de La Bomba con Fisher-Yates
│   │   │   ├── ConfessionsGame.tsx    # Ruleta de confesiones interactiva
│   │   │   └── NeverHaveIEverGame.tsx # Yo Nunca aleatorio
│   │   └── ui/
│   │       ├── DisclaimerBanner.tsx   # Banner legal persistente por país
│   │       └── DisclaimerModal.tsx    # Modal de marco legal y advertencia penal
│   ├── config/
│   │   └── locales/
│   │       ├── schema.ts              # Esquema TypeScript estricto de localización
│   │       ├── cl.ts                  # Configuración completa de Chile 🇨🇱
│   │       ├── mx.ts                  # Configuración completa de México 🇲🇽
│   │       ├── us.ts                  # Configuración completa de EE.UU. 🇺🇸
│   │       ├── jp.ts                  # Configuración completa de Japón 🇯🇵
│   │       └── index.ts               # Diccionario y utilidades de país
│   ├── lib/
│   │   ├── useLocale.ts               # Hook de i18n con persistencia en localStorage
│   │   ├── carreteState.ts            # Tipos y función de merge LWW para sincronización
│   │   └── widmark.ts                 # Algoritmo metabólico de Widmark
│   └── data/
│       ├── cocktail_recipes.json      # Catálogo de cócteles chilenos e internacionales
│       ├── prices_cl.json             # Catálogo offline de precios retail
│       ├── games.json                 # Banco de preguntas y categorías
│       └── myths.json                 # Evidencia farmacológica de mitos
├── package.json
└── README.md
```

---

## ⚡ Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js 18+ o superior
- npm / pnpm / yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/Rodrigo-Ordenes/tonight-round.git
cd Round

# Instalar dependencias
npm install
```

### Ejecución en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible de inmediato en [http://localhost:3000](http://localhost:3000).

### Compilación para Producción
```bash
npm run build
npm run start
```

---

## ⚖️ Marco Legal y Responsabilidad

Tonight es una herramienta de entretenimiento, planificación logística y bienestar social.
- **Chile:** Ley N° 20.580 (Tolerancia Cero) y Ley N° 20.770 (Ley Emilia). El límite penal es de 0.30 g/l.
- **México:** Reglamento de Tránsito y sanciones del Centro de Sanciones Administrativas ("El Torito", 0.40 g/l).
- **Estados Unidos:** Leyes estatales de DUI con límite estricto de 0.08% BAC.
- **Japón:** Ley de Tráfico Vial (Tolerancia Cero Absoluta 0.00 mg/l) y responsabilidad penal extendida a acompañantes.

> **Advertencia:** Las estimaciones de alcoholemia son puramente didácticas y aproximadas según modelos farmacocinéticos teóricos. La absorción real varía según el metabolismo individual, ingesta de alimentos, hidratación y factores biológicos. **Si vas a conducir, la única cifra segura de consumo es Cero (0.00). Pasa las llaves o pide un auto de regreso.**
