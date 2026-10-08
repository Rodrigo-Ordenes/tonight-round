import { LocaleConfig } from "./schema";

export const mxLocale: LocaleConfig = {
  locale: "es-MX",
  countryCode: "MX",
  countryName: "México",
  currency: {
    code: "MXN",
    symbol: "$",
    decimals: 0,
    thousandSeparator: ",",
    decimalSeparator: ".",
    format: (amount: number) => {
      const rounded = Math.round(amount);
      return `$${rounded.toLocaleString("es-MX")} MXN`;
    },
  },
  slang: {
    party: "peda / fiesta",
    drinking: "chelear / pistear",
    hangover: "cruda",
    moneyUnit: "varos / pesos",
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
      category: "coctel",
      standardAbv: 0.04,
      defaultServingMl: 500,
      alcoholMlPerServing: 16.0,
      description: "Cerveza preparada con clamato, salsas negras, limón y chile en polvo.",
    },
  ],
  legal: {
    countryName: "México",
    lawsTitle: "Reglamento de Tránsito y Programa Conduce Sin Alcohol (El Torito)",
    zeroToleranceLimit: 0.4,
    intoxicationLimit: 0.8,
    disclaimerText:
      "Esta calculadora es pedagógica y de referencia. En México, rebasar 0.40 mg/l de alcohol en aire espirado amerita arresto inconmutable de 20 a 36 horas en el Centro de Sanciones Administrativas ('El Torito') y remisión del vehículo al corralón. Si tomas, no manejes.",
    penaltiesSummary:
      "• 0.40 mg/l o más: Arresto obligatorio de hasta 36 horas en 'El Torito', retiro de puntos de licencia y corralón obligatorio.",
    emergencyNumber: "911 (Emergencias México)",
  },
  labels: {
    appTitle: "Tonight",
    tagline: "Copiloto de la Peda",
    nav: {
      home: "Inicio",
      armar: "Armar Peda",
      juegos: "Juegos",
      tiempo: "¿En cuánto baja?",
      dividir: "Coperacha",
      mitos: "Mitos y Cruda",
    },
    moments: {
      planning: {
        title: "Tarde / Preparación",
        subtitle: "Calcula caguamas, botellas y la coperacha por persona.",
      },
      live: {
        title: "Noche / En la Peda",
        subtitle: "Juegos, ruleta de retos y monitoreo de compas.",
      },
      closing: {
        title: "Madrugada / El Cierre",
        subtitle: "Divide la cuenta, pide Uber y checa los mitos de la cruda.",
      },
    },
  },
};

export default mxLocale;
