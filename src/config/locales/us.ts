import { LocaleConfig } from "./schema";

export const usLocale: LocaleConfig = {
  locale: "en-US",
  countryCode: "US",
  countryName: "United States",
  currency: {
    code: "USD",
    symbol: "$",
    decimals: 2,
    thousandSeparator: ",",
    decimalSeparator: ".",
    format: (amount: number) => {
      return `$${amount.toFixed(2)} USD`;
    },
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
  ],
  legal: {
    countryName: "United States",
    lawsTitle: "DUI Laws (BAC 0.08% Legal Limit & Zero Tolerance Under 21)",
    zeroToleranceLimit: 0.02,
    intoxicationLimit: 0.08,
    disclaimerText:
      "This calculator is strictly educational. In the United States, driving with a BAC of 0.08% or higher is illegal across all 50 states (DUI/DWI), carrying immediate license suspension, steep fines, and mandatory jail time. Strict Zero Tolerance applies to drivers under 21. Never drink and drive.",
    penaltiesSummary:
      "• BAC ≥ 0.08%: Criminal DUI arrest, license suspension, ignition interlock device, and high insurance penalties.",
    emergencyNumber: "911 (US Emergency Services)",
  },
  labels: {
    appTitle: "Tonight",
    tagline: "The Ultimate Party Copilot",
    nav: {
      home: "Home",
      armar: "Party Plan",
      juegos: "Games",
      tiempo: "BAC Timer",
      dividir: "Split Tab",
      mitos: "Hangover Myths",
    },
    moments: {
      planning: {
        title: "Afternoon / Pregame Prep",
        subtitle: "Calculate drinks, mixers, ice and per-person cost.",
      },
      live: {
        title: "Night / At the Party",
        subtitle: "Interactive games, Smart TV sync and driver protection.",
      },
      closing: {
        title: "Late Night / Heading Home",
        subtitle: "Split the tab on Venmo, hail an Uber and safe check-in.",
      },
    },
  },
};

export default usLocale;
