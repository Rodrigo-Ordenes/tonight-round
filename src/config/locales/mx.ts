import { LocaleConfig } from "./schema";

export const COMMON_BANKS_MX = [
  "BBVA México",
  "Mercado Pago",
  "Santander México",
  "Banorte",
  "Citibanamex",
  "Nu México",
  "HSBC México",
  "Banco Azteca",
  "Scotiabank México",
  "Inbursa",
];

export const mxLocale: LocaleConfig = {
  locale: "es-MX",
  countryCode: "MX",
  countryName: "México",
  flag: "🇲🇽",

  currency: {
    code: "MXN",
    symbol: "$",
    decimals: 0,
    thousandSeparator: ",",
    decimalSeparator: ".",
    slangName: "varos / fierros",
    format: (amount: number) => {
      const rounded = Math.round(amount);
      return `$${rounded.toLocaleString("es-MX")} MXN`;
    },
  },

  terminology: {
    partyName: "Peda",
    pregameName: "Precopeo",
    driverTitle: "Conductor Designado (Piloto)",
    soberStatus: "Sobrio / Al tiro",
  },

  legal: {
    lawName: "Reglamento de Tránsito Metropolitano ('El Torito')",
    lawsTitle: "Reglamento de Tránsito Metropolitano y Conduce Sin Alcohol (México)",
    bacLimitText: "0.40 g/l",
    zeroToleranceLimit: 0.4,
    intoxicationLimit: 0.8,
    disclaimer:
      "En México, el programa 'Conduce Sin Alcohol' sanciona con arresto inconmutable de 20 a 36 horas en el Centro de Sanciones Administrativas ('El Torito') a quien supere 0.40 g/l (o 0.8 mg/l en aire). Si tomas, no manejes.",
    disclaimerText:
      "Esta calculadora es pedagógica y de divulgación. En México, el programa 'Conduce Sin Alcohol' sanciona con arresto administrativo inconmutable de 20 a 36 horas en el Centro de Sanciones Administrativas ('El Torito') a quien supere 0.40 g/l en sangre (o 0.8 mg/l en aire). Además de remisión del vehículo al corralón. NUNCA conduzcas después de ingerir bebidas alcohólicas.",
    penaltiesSummary:
      "• Superar 0.40 g/l: Arresto administrativo inconmutable de 20 a 36 horas en 'El Torito', 6 puntos de penalización en la licencia y arrastre del auto al corralón (depósito vehicular).",
    emergencyNumber: "911 (Emergencias México)",
    countryName: "México",
  },

  banking: {
    systemName: "Transferencia SPEI (CLABE 18 dígitos)",
    fields: ["Titular", "CLABE Interbancaria (18 dígitos)", "Banco", "Concepto"],
    commonBanks: COMMON_BANKS_MX,
    copyTemplate: (data: {
      holderName?: string;
      clabe?: string;
      bank?: string;
      amount?: number;
      concept?: string;
    }) => {
      const lines = [
        "🌮 *DATOS DE TRANSFERENCIA SPEI (COPERACHA PEDA)* 🇲🇽",
        data.amount ? `💰 Monto por persona: $${Math.round(data.amount).toLocaleString("es-MX")} MXN` : "",
        data.holderName ? `👤 Beneficiario: ${data.holderName}` : "",
        data.clabe ? `🔢 CLABE (18 dígitos): ${data.clabe}` : "",
        data.bank ? `🏦 Banco: ${data.bank}` : "",
        data.concept ? `📝 Concepto: ${data.concept}` : "📝 Concepto: Peda Tonight",
        "\n_Copia la CLABE y transfiriere al instante vía SPEI (BBVA, Nu, Mercado Pago, etc.)_",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },

  delivery: {
    services: [
      { name: "Rappi México", urlTemplate: "https://www.rappi.com.mx" },
      { name: "Uber Eats México", urlTemplate: "https://www.ubereats.com/mx" },
      { name: "DiDi Food", urlTemplate: "https://www.didi-food.com/es-MX" },
    ],
  },

  drinks: {
    stapleName: "Paloma / Michelada",
    stapleRatioDefaults: { spirit: 30, mixer: 70 },
    spiritName: "Tequila / Mezcal",
    mixerName: "Refresco de Toronja / Clamato",
  },

  slang: {
    party: "peda / fiesta",
    drinking: "chelear / pistear",
    hangover: "cruda",
    moneyUnit: "varos / fierros",
    friendGroup: "los compas",
    splitBill: "hacer la vaquita / coperacha",
    signatureDrink: "michelada / tequila",
  },

  typicalDrinks: [
    {
      id: "tequila_shot",
      name: "Caballito de Tequila Reposado (45ml, 38°)",
      shortName: "Tequila 38°",
      category: "destilado",
      standardAbv: 0.38,
      defaultServingMl: 45,
      alcoholMlPerServing: 13.68,
      description: "Tequila tradicional con limón y sal.",
    },
    {
      id: "caguama_lager",
      name: "Caguama / Cerveza (940ml o lata 355ml, 4.5°)",
      shortName: "Cerveza 4.5°",
      category: "cerveza",
      standardAbv: 0.045,
      defaultServingMl: 355,
      alcoholMlPerServing: 12.78,
      description: "Corona, Victoria o Modelo Especial bien fría.",
    },
    {
      id: "mezcal_shot",
      name: "Shot de Mezcal con naranja y sal de gusano (45ml, 42°)",
      shortName: "Mezcal 42°",
      category: "destilado",
      standardAbv: 0.42,
      defaultServingMl: 45,
      alcoholMlPerServing: 15.12,
      description: "Mezcal artesanal oaxaqueño.",
    },
    {
      id: "michelada_cubana",
      name: "Michelada Cubana con salsas (500ml)",
      shortName: "Michelada",
      category: "cerveza",
      standardAbv: 0.04,
      defaultServingMl: 500,
      alcoholMlPerServing: 16.0,
      description: "Cerveza con jugo de limón, salsa inglesa, Maggi, Tabasco y sal y chile en el borde.",
    },
    {
      id: "paloma",
      name: "Paloma Clásica con Tequila y Toronja (250ml)",
      shortName: "Paloma",
      category: "coctel",
      standardAbv: 0.12,
      defaultServingMl: 250,
      alcoholMlPerServing: 24.0,
      description: "Tequila blanco, refresco de toronja (Squirt), limón y sal.",
    },
  ],

  labels: {
    appTitle: "Tonight",
    tagline: "Copiloto de la Peda",
    nav: {
      home: "Inicio",
      armar: "Armar la Peda",
      juegos: "Juegos",
      tiempo: "¿En cuánto baja?",
      dividir: "Coperacha / Dividir",
      mitos: "Mitos y Cruda",
    },
  },
};

export default mxLocale;
