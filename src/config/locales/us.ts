import { LocaleConfig } from "./schema";

export const usLocale: LocaleConfig = {
  locale: "en-US",
  countryCode: "US",
  countryName: "United States",
  flag: "🇺🇸",

  currency: {
    code: "USD",
    symbol: "$",
    decimals: 2,
    thousandSeparator: ",",
    decimalSeparator: ".",
    slangName: "bucks",
    format: (amount: number) => {
      return `$${amount.toFixed(2)} USD`;
    },
  },

  terminology: {
    partyName: "Party",
    pregameName: "Pregame",
    driverTitle: "Designated Driver (DD)",
    soberStatus: "Sober / Good to drive",
  },

  legal: {
    lawName: "DUI Federal & State Laws (BAC 0.08% Limit)",
    lawsTitle: "DUI Laws (BAC 0.08% Legal Limit & Zero Tolerance Under 21)",
    bacLimitText: "0.08% BAC",
    zeroToleranceLimit: 0.08,
    intoxicationLimit: 0.15,
    disclaimer:
      "In the United States, driving with a BAC of 0.08% or higher is illegal in all 50 states (0.05% in Utah). Strict Zero Tolerance applies to drivers under 21 (0.00% to 0.02%). Never drink and drive.",
    disclaimerText:
      "This calculator is strictly educational. Driving with a Blood Alcohol Concentration (BAC) of 0.08% or higher is a criminal offense in all 50 states (0.05% in Utah). Drivers under the age of 21 face strict Zero Tolerance laws (0.00% - 0.02%). Biological alcohol metabolism depends on multiple unique factors. Never drive under the influence.",
    penaltiesSummary:
      "• 1st offense DUI: Driver's license suspension (3-12 months), mandatory alcohol education, fines up to $2,000, and potential jail time.",
    emergencyNumber: "911 (US Emergency Services)",
    countryName: "United States",
  },

  banking: {
    systemName: "Venmo / Zelle / Cash App",
    fields: ["Venmo Handle (@)", "Zelle (Phone or Email)", "Cash App ($cashtag)"],
    copyTemplate: (data: {
      venmo?: string;
      zelle?: string;
      cashapp?: string;
      amount?: number;
      holderName?: string;
    }) => {
      const lines = [
        "🍕 *PARTY SPLIT TAB REQUEST* 🇺🇸",
        data.amount ? `💵 Split per person: $${data.amount.toFixed(2)} USD` : "",
        data.holderName ? `👤 Host: ${data.holderName}` : "",
        data.venmo ? `📱 Venmo: ${data.venmo}` : "",
        data.zelle ? `🏦 Zelle: ${data.zelle}` : "",
        data.cashapp ? `💸 Cash App: ${data.cashapp}` : "",
        "\n_Send your split via Venmo, Zelle or Cash App._",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },

  delivery: {
    services: [
      { name: "DoorDash", urlTemplate: "https://www.doordash.com" },
      { name: "Uber Eats US", urlTemplate: "https://www.ubereats.com" },
      { name: "Instacart", urlTemplate: "https://www.instacart.com" },
    ],
  },

  drinks: {
    stapleName: "Hard Seltzer / Bourbon & Coke",
    stapleRatioDefaults: { spirit: 30, mixer: 70 },
    spiritName: "Bourbon / Vodka",
    mixerName: "Soda / Seltzer / Cola",
  },

  slang: {
    party: "party / pregame",
    drinking: "drinking / partying",
    hangover: "hangover",
    moneyUnit: "bucks / dollars",
    friendGroup: "the squad / crew",
    splitBill: "split the tab / Venmo request",
    signatureDrink: "hard seltzer / craft IPA",
  },

  typicalDrinks: [
    {
      id: "hard_seltzer",
      name: "Hard Seltzer 12oz (White Claw, Truly, 5%)",
      shortName: "Seltzer 5%",
      category: "cerveza",
      standardAbv: 0.05,
      defaultServingMl: 355,
      alcoholMlPerServing: 14.2,
      description: "Low-calorie spiked sparkling water.",
    },
    {
      id: "ipa_beer",
      name: "Craft IPA Can / Pint (12-16oz, ~6.5%)",
      shortName: "Craft IPA",
      category: "cerveza",
      standardAbv: 0.065,
      defaultServingMl: 355,
      alcoholMlPerServing: 18.5,
      description: "Hoppy American craft beer.",
    },
    {
      id: "whiskey_shot",
      name: "Bourbon / Vodka Shot (1.5oz, 40%)",
      shortName: "Shot 40%",
      category: "destilado",
      standardAbv: 0.40,
      defaultServingMl: 44,
      alcoholMlPerServing: 14.08,
      description: "Standard American 1.5oz shot.",
    },
    {
      id: "vodka_soda",
      name: "Vodka Soda with Lime (1.5oz spirit, ~12% ABV)",
      shortName: "Vodka Soda",
      category: "coctel",
      standardAbv: 0.12,
      defaultServingMl: 200,
      alcoholMlPerServing: 17.6,
      description: "Vodka with club soda and fresh lime wedge.",
    },
  ],

  labels: {
    appTitle: "Tonight",
    tagline: "The Party Copilot",
    nav: {
      home: "Home",
      armar: "Plan Party",
      juegos: "Games",
      tiempo: "Sober Clock",
      dividir: "Split Tab",
      mitos: "Hangover Myths",
    },
  },
};

export default usLocale;
