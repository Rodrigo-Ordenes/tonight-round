import { LocaleConfig } from "./schema";

export const COMMON_BANKS_CL = [
  "BancoEstado (CuentaRUT)",
  "Banco de Chile / Edwards",
  "Banco Santander",
  "BCI / Mach",
  "Scotiabank",
  "Itaú",
  "Banco Falabella",
  "Banco Ripley",
  "Banco BICE",
  "Banco Security",
  "Tenpo / Prepago",
  "Mercado Pago",
];

export const ACCOUNT_TYPES_CL = [
  "CuentaRUT / Vista",
  "Cuenta Corriente",
  "Cuenta de Ahorro",
];

export const clLocale: LocaleConfig = {
  locale: "es-CL",
  countryCode: "CL",
  countryName: "Chile",
  flag: "🇨🇱",

  currency: {
    code: "CLP",
    symbol: "$",
    decimals: 0,
    thousandSeparator: ".",
    decimalSeparator: ",",
    slangName: "lucas",
    format: (amount: number) => {
      const rounded = Math.round(amount);
      return `$${rounded.toLocaleString("es-CL")}`;
    },
  },

  terminology: {
    partyName: "Carrete",
    pregameName: "Previa",
    driverTitle: "Piloto 0.0 (Conductor Designado)",
    soberStatus: "Sobrio",
  },

  legal: {
    lawName: "Ley Emilia y Ley de Tolerancia Cero (Chile)",
    lawsTitle: "Ley Emilia y Ley de Tolerancia Cero (Chile)",
    bacLimitText: "0.30 g/l",
    zeroToleranceLimit: 0.3,
    intoxicationLimit: 0.8,
    disclaimer:
      "Esta calculadora es pedagógica y de divulgación. En Chile rige Tolerancia Cero (Ley N° 20.580) y Ley Emilia (Ley N° 20.770). Cualquier concentración desde 0.30 g/l conlleva sanciones penales y retiro inmediato de licencia. Nunca manejes si has consumido alcohol.",
    disclaimerText:
      "Esta calculadora es exclusivamente pedagógica y referencial. La metabolización varía según factores biológicos individuales (enzimas hepáticas, masa magra, alimentación, hidratación, etc.). Bajo la legislación chilena (Ley Emilia y Tolerancia Cero), cualquier concentración desde 0.3 g/l es penalizada con retiro de licencia y sanciones penales. NUNCA uses esta estimación para determinar si puedes conducir. Si bebes, no manejes.",
    penaltiesSummary:
      "• 0.30 a 0.79 g/l: Bajo la influencia del alcohol (suspensión de licencia por 3 meses a 5 años según reincidencia y daños).\n• ≥ 0.80 g/l: Estado de ebriedad (suspensión de 2 años hasta cancelación perpetua de licencia, además de penas de cárcel de 3 años y un día a 10 años en caso de lesiones graves o muerte bajo Ley Emilia).",
    emergencyNumber: "131 (SAMU) / 133 (Carabineros)",
    countryName: "Chile",
  },

  banking: {
    systemName: "BancoEstado (CuentaRUT) / Transferencia",
    fields: ["Titular", "RUT", "Banco", "Tipo de Cuenta", "N° de Cuenta", "Email"],
    commonBanks: COMMON_BANKS_CL,
    accountTypes: ACCOUNT_TYPES_CL,
    copyTemplate: (data: {
      holderName?: string;
      rut?: string;
      bank?: string;
      accountType?: string;
      accountNumber?: string;
      email?: string;
      amount?: number;
    }) => {
      const lines = [
        "🍻 *DATOS DE TRANSFERENCIA (CUOTA CARRETE)* 🇨🇱",
        data.amount ? `💰 Monto por persona: $${Math.round(data.amount).toLocaleString("es-CL")}` : "",
        data.holderName ? `👤 Nombre: ${data.holderName}` : "",
        data.rut ? `🆔 RUT: ${data.rut}` : "",
        data.bank ? `🏦 Banco: ${data.bank}` : "",
        data.accountType ? `📋 Tipo: ${data.accountType}` : "",
        data.accountNumber ? `🔢 Cuenta: ${data.accountNumber}` : "",
        data.email ? `✉️ Correo: ${data.email}` : "",
        "\n_Copia y pega en tu app bancaria (BancoEstado, Santander, Mach, etc.)_",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },

  delivery: {
    services: [
      { name: "PedidosYa", urlTemplate: "https://www.pedidosya.cl" },
      { name: "Rappi Chile", urlTemplate: "https://www.rappi.cl" },
      { name: "Uber Eats", urlTemplate: "https://www.ubereats.com/cl" },
    ],
  },

  drinks: {
    stapleName: "Piscola",
    stapleRatioDefaults: { spirit: 30, mixer: 70 },
    spiritName: "Pisco 35° / 40°",
    mixerName: "Bebida Cola",
  },

  slang: {
    party: "carrete",
    drinking: "tomar / chupar",
    hangover: "caña",
    moneyUnit: "lucas",
    friendGroup: "los cabros",
    splitBill: "hacer la vaca / pagar la cuota",
    signatureDrink: "piscola",
  },

  typicalDrinks: [
    {
      id: "piscola_35",
      name: "Piscola 35° (Alto / Mistral)",
      shortName: "Piscola 35°",
      category: "destilado",
      standardAbv: 0.35,
      defaultServingMl: 60,
      alcoholMlPerServing: 21,
      mixerRatio: 3,
      description: "El trago insignia de Chile: pisco chileno de 35° con bebida cola y hielo.",
    },
    {
      id: "piscola_40",
      name: "Piscola 40° (Reservado / Gran Nobel)",
      shortName: "Piscola 40°",
      category: "destilado",
      standardAbv: 0.40,
      defaultServingMl: 60,
      alcoholMlPerServing: 24,
      mixerRatio: 3,
      description: "Piscola de mayor graduación alcohólica y cuerpo.",
    },
    {
      id: "cerveza_lata",
      name: "Lata de Cerveza Lager (350cc, ~5°)",
      shortName: "Lata Lager",
      category: "cerveza",
      standardAbv: 0.05,
      defaultServingMl: 350,
      alcoholMlPerServing: 17.5,
      description: "Cerveza rubia clásica (Cristal, Royal, Heineken, Escudo).",
    },
    {
      id: "cerveza_artesanal",
      name: "Cerveza Artesanal / IPA (330cc, ~6.5°)",
      shortName: "Cerveza IPA",
      category: "cerveza",
      standardAbv: 0.065,
      defaultServingMl: 330,
      alcoholMlPerServing: 21.45,
      description: "Cerveza con mayor graduación y amargor lupulado (Kross, Kunstmann, Austral).",
    },
    {
      id: "vodka_mixer",
      name: "Vodka con Jugo / Energética (60cc, ~40°)",
      shortName: "Vodka",
      category: "destilado",
      standardAbv: 0.40,
      defaultServingMl: 60,
      alcoholMlPerServing: 24,
      mixerRatio: 3,
      description: "Vodka mezclado con jugo de naranja o bebida energética.",
    },
    {
      id: "gin_tonica",
      name: "Gin Tonic (60cc, ~40°)",
      shortName: "Gin Tonic",
      category: "destilado",
      standardAbv: 0.40,
      defaultServingMl: 60,
      alcoholMlPerServing: 24,
      mixerRatio: 3,
      description: "Gin London Dry con agua tónica, hielo y rodaja de limón o pepino.",
    },
    {
      id: "ron_cola",
      name: "Ron Cola (60cc, ~38°)",
      shortName: "Ron Cola",
      category: "destilado",
      standardAbv: 0.38,
      defaultServingMl: 60,
      alcoholMlPerServing: 22.8,
      mixerRatio: 3,
      description: "Ron dorado o añejo con bebida cola y hielo.",
    },
    {
      id: "copa_vino",
      name: "Copa de Vino Tinto o Blanco (150cc, ~13°)",
      shortName: "Copa de Vino",
      category: "vino",
      standardAbv: 0.13,
      defaultServingMl: 150,
      alcoholMlPerServing: 19.5,
      description: "Vino chileno (Cabernet, Carmenere, Sauvignon Blanc).",
    },
    {
      id: "terremoto",
      name: "Terremoto Típico (250cc)",
      shortName: "Terremoto",
      category: "coctel",
      standardAbv: 0.09,
      defaultServingMl: 250,
      alcoholMlPerServing: 22.5,
      description: "Pipeño con helado de piña y toque de granadina o fernet.",
    },
  ],

  labels: {
    appTitle: "Tonight",
    tagline: "Copiloto del Carrete",
    nav: {
      home: "Inicio",
      armar: "Armar Carrete",
      juegos: "Juegos",
      tiempo: "¿En cuánto baja?",
      dividir: "Dividir Cuenta",
      mitos: "Mitos y Verdades",
    },
    moments: {
      planning: {
        title: "Tarde / Planificación",
        subtitle: "Calcula insumos, packs y presupuesto exacto para comprar.",
      },
      live: {
        title: "Noche / En la junta",
        subtitle: "Juegos, ruleta interactiva y estimador biológico responsable.",
      },
      closing: {
        title: "Madrugada / Cierre",
        subtitle: "Divide los gastos, cobra las cuotas por WhatsApp y aclara mitos de la caña.",
      },
    },
  },
};

export default clLocale;
