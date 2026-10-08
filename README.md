# 🌙 Tonight / Round — Sistema Operativo de la Vida Social Nocturna (V3 Global) 🌐

Web app gratuita, ultra-rápida, mobile-first y optimizada para Smart TV sin muros de pago ni registros forzados. Transforma una simple calculadora en una **plataforma social sincrónica para carretes, fiestas y reuniones en todo el mundo**.

> *"Todo lo que necesitas para organizar, gozar y cuidar la noche, en un solo lugar."*

---

## 🏆 Diagnóstico & Visión Estratégica V3

Las webs de fiestas tradicionales fracasan porque son **herramientas desechables** (el usuario entra 3 minutos a calcular botellas, cierra la pestaña y nunca más regresa). 

**Tonight V3** supera este riesgo convirtiéndose en el **sistema operativo de la fiesta**, combinando:
1. La practicidad de división de gastos y cobro de **Splitwise**.
2. El efecto multijugador viral de salas y controles de **Jackbox Games**.
3. La logística en 1 clic de carritos y delivery express de **Partiful / Drizly**.
4. La seguridad y cuidado mutuo con conductor designado y check-in seguro de **Uber**.

---

## 🚀 Los 4 Pilares Estratégicos de la Plataforma Global

### 1. 📺 Sincronización en Vivo sin Registro ("Efecto Jackbox" / Salas Efímeras `/sala`)
- **Código de 4 Letras o QR:** El anfitrión crea una sala en segundos (ej. `tonight.app/sala/LIT1`).
- **Pantalla de Smart TV / Monitor = Host Central:** Muestra el código de sala, el código QR gigante, el estado de los amigos conectados y las dinámicas en juego.
- **Celulares de los Invitados = Mandos de Control:** Cada participante se une desde su smartphone, suma sus tragos a su ficha, envía preguntas de confesión anónimas y marca su check-in.
- **Factor Viral (K > 2.5):** Un anfitrión expone la app directamente a 10-15 personas que la juegan activamente en su propio smartphone.

### 2. ⚡ Logística de Compra en 1 Clic (Deep Links a Delivery)
- Integra accesos directos con búsqueda pre-cargada a las principales apps de delivery:
  - 🇨🇱 **Chile:** Rappi, PedidosYa, Uber Eats Express.
  - 🇲🇽 **México:** Rappi, Uber Eats, Didi Food.
  - 🇺🇸 **Estados Unidos:** Uber Eats / Drizly, Instacart.
- Tiempos de entrega estimados en 25-40 min para no cortar el ambiente del carrete.

### 3. 🏠 Seguridad Proactiva y Retorno Seguro (`/seguridad`)
- **Botón "Pedir Viaje Seguro":** Deep links instantáneos a **Uber**, **Cabify** y **DiDi** con un toque.
- **Tablero de Llegada Segura ("Llegué a Salvo"):** Los asistentes confirman en 1 clic cuando llegan a su casa, actualizando el tablero en vivo para tranquilidad de todo el grupo.
- **🚨 Alerta Penal para Conductores Designados:** Si un conductor bebe, el sistema activa una alerta roja permanente y despliega la opción inmediata de pedirle un auto.

### 4. 🎮 Game Studio Digital Integrado
- **💣 La Bomba de Tiempo:** Cronómetro de 10 segundos bajo tensión acelerada. Quien tenga el teléfono al momento de la detonación paga la penitencia.
- **🎭 Ruleta Rusa de Confesiones:** Preguntas atrevidas y dilemas con votación grupal en vivo.
- **Modo Proyector / Smart TV:** Vista a pantalla completa con atajos de teclado para controles remotos.

---

## 🌍 Localización Cultural Radical

Tonight V3 incorpora un selector dinámico de país y moneda en la barra de navegación:
- 🇨🇱 **Chile (CLP):** Piscola 35°/40° (ratios 3:1), cerveza en lata, hielo 4kg, CuentaRUT, Ley Emilia y Ley de Tolerancia Cero (0.30 g/l).
- 🇲🇽 **México (MXN):** Tequila, mezcal, caguamas, micheladas con clamato, coperacha y reglamento de "El Torito" (0.40 g/l).
- 🇺🇸 **Estados Unidos (USD):** Hard Seltzers (White Claw), Craft IPAs, shots de 1.5oz, Beer Pong, BYOB, Venmo y DUI Limit (BAC 0.08%).

---

## 📂 Arquitectura de Archivos V3

```
Round/
├── scraper/
│   ├── scraper.py                 # Extractor multitienda (Líder, Jumbo, Botillería)
│   ├── targets.json               # Canasta de 40 SKUs críticos
│   └── requirements.txt           # requests, beautifulsoup4
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout responsive (max-w-7xl)
│   │   ├── page.tsx               # Hub interactivo V3
│   │   ├── armar/page.tsx         # Cotizador multitienda con delivery en 1 clic
│   │   ├── sala/page.tsx          # Lobby de Salas Efímeras (Jackbox style)
│   │   ├── sala/[code]/page.tsx   # Sala sincrónica (Modo Host TV vs Mando Celular)
│   │   ├── grupo/page.tsx         # Tablero grupal y conductor designado
│   │   ├── juegos/page.tsx        # Game Studio y Smart TV
│   │   ├── seguridad/page.tsx     # Retorno seguro en Uber/Cabify y check-in 🏠
│   │   ├── tiempo/page.tsx        # Simulador biológico de Widmark
│   │   ├── dividir/page.tsx       # División de cuenta bancaria
│   │   └── mitos/page.tsx         # Fichas científicas
│   ├── components/
│   │   ├── calculators/
│   │   │   ├── BasketOptimizer.tsx    # 3 perfiles (Ahorro, Clásica, Mocktail)
│   │   │   ├── PriceComparator.tsx    # Comparativa Líder vs Jumbo vs Boti
│   │   │   └── SplitBill.tsx          # Cobro y transferencia
│   │   ├── delivery/
│   │   │   └── DeliveryDeepLinks.tsx  # Rappi, PedidosYa, Uber Eats en 1 clic
│   │   ├── safety/
│   │   │   └── SafeReturnHub.tsx      # Ride hailing y check-in "Llegué a salvo"
│   │   ├── group/
│   │   │   ├── GroupTracker.tsx       # Tablero colectivo
│   │   │   ├── UserAlcoholCard.tsx    # Tarjeta de 1-clic por persona
│   │   │   └── DriverAlertModal.tsx   # Alerta Ley Emilia para conductores
│   │   ├── games/
│   │   │   ├── TimeBombGame.tsx       # La Bomba de Tiempo (10s)
│   │   │   ├── ConfessionsGame.tsx    # Ruleta Rusa de Confesiones
│   │   │   ├── TVGameMode.tsx         # Vista Smart TV en pantalla completa
│   │   │   └── GameDeck.tsx           # Catálogo y ruleta de retos
│   │   └── common/
│   │       └── Navbar.tsx             # Selector de país (🇨🇱 🇲🇽 🇺🇸) y navegación
│   ├── store/
│   │   ├── usePartyStore.ts       # Estado persistente de junta y canasta
│   │   └── useRoomStore.ts        # Sincronización en vivo de salas efímeras
│   ├── config/
│   │   └── locales/
│   │       ├── cl.ts              # Chile
│   │       ├── mx.ts              # México
│   │       ├── us.ts              # Estados Unidos
│   │       └── index.ts           # Selector dinámico de locales
│   └── data/
│       ├── prices_cl.json         # Snapshot multitienda de retail
│       ├── games.json             # Catálogo de juegos
│       └── myths.json             # Evidencia científica
├── package.json
└── README.md
```

---

## ⚡ Puesta en Marcha

```bash
# Servidor de desarrollo
npm run dev

# Compilación de producción
npm run build
```

Acceso local: `http://localhost:3000`
