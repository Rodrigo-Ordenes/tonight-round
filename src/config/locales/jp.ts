import { LocaleConfig } from "./schema";

export const COMMON_BANKS_JP = [
  "PayPay (アプリ送金)",
  "Line Pay",
  "Yucho Bank (ゆうちょ銀行)",
  "Mitsubishi UFJ (MUFG)",
  "Sumitomo Mitsui (SMBC)",
  "Mizuho Bank (みずほ銀行)",
  "Rakuten Bank (楽天銀行)",
];

export const jpLocale: LocaleConfig = {
  locale: "ja-JP",
  countryCode: "JP",
  countryName: "Japón",
  flag: "🇯🇵",

  currency: {
    code: "JPY",
    symbol: "¥",
    decimals: 0,
    thousandSeparator: ",",
    decimalSeparator: ".",
    slangName: "yenes (円)",
    format: (amount: number) => {
      const rounded = Math.round(amount);
      return `¥${rounded.toLocaleString("ja-JP")}`;
    },
  },

  terminology: {
    partyName: "Nomikai (飲み会)",
    pregameName: "0次会 (Zero-kai)",
    driverTitle: "Daikou (代行利用 / 指定運転手)",
    soberStatus: "Shirafu (素面) / Yopparai (酔っ払い)",
  },

  legal: {
    lawName: "道路交通法 (Road Traffic Act - Absolute Zero)",
    lawsTitle: "日本の飲酒運転厳罰化法 (Zero Tolerance & Daikou System)",
    bacLimitText: "0.00% BAC (0.15 mg/l 呼気)",
    zeroToleranceLimit: 0.03, // BAC 0.03% = 0.15 mg/l en aire espirado
    intoxicationLimit: 0.05,
    disclaimer:
      "日本では飲酒運転に対して「絶対零度（ゼロ・トレランス）」が適用されます。呼気中アルコール濃度0.15 mg/l以上で酒気帯び運転となり、免許取消や懲役刑が科されます。飲んだら必ず「運転代行」またはタクシーを利用してください。",
    disclaimerText:
      "本シミュレーターは教育・情報提供のみを目的としています。日本の道路交通法では、呼気中アルコール濃度0.15 mg/l（血中約0.03%）以上で「酒気帯び運転」、泥酔状態では「酒酔い運転」として厳罰（最大懲役5年、罰金100万円、同乗者・酒類提供者も処罰）が科されます。絶対に飲酒運転をしないでください。",
    penaltiesSummary:
      "• 酒気帯び運転 (0.15 mg/l以上): 3年以下の懲役または50万円以下の罰金、免許停止・取消。\n• 酒酔い運転: 5年以下の懲役または100万円以下の罰金。\n• 代行サービス (Daikou): 帰宅時はプロの運転代行を利用してください。",
    emergencyNumber: "110 (警察) / 119 (消防・救急)",
    countryName: "Japón",
  },

  banking: {
    systemName: "PayPay / Line Pay / 割り勘 (Warikan)",
    fields: ["PayPay ID", "Line Pay", "銀行口座 (銀行名・支店・番号)", "受取人名"],
    commonBanks: COMMON_BANKS_JP,
    copyTemplate: (data: {
      paypayId?: string;
      linePay?: string;
      holderName?: string;
      amount?: number;
      bank?: string;
    }) => {
      const lines = [
        "🍶 *飲み会 割り勘 (WARIKAN) 送金先* 🇯🇵",
        data.amount ? `💴 一人あたりの金額: ¥${Math.round(data.amount).toLocaleString("ja-JP")}` : "",
        data.holderName ? `👤 幹事 (Host): ${data.holderName}` : "",
        data.paypayId ? `📱 PayPay ID: ${data.paypayId}` : "",
        data.linePay ? `💬 Line Pay: ${data.linePay}` : "",
        data.bank ? `🏦 銀行: ${data.bank}` : "",
        "\n_PayPay送金またはLINE Payでスムーズにお支払いください。_",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },

  delivery: {
    services: [
      { name: "Uber Eats Japan", urlTemplate: "https://www.ubereats.com/jp" },
      { name: "出前館 (Demae-can)", urlTemplate: "https://demae-can.com" },
      { name: "Kakuyasu (カクヤス お酒宅配)", urlTemplate: "https://www.kakuyasu.co.jp" },
    ],
  },

  drinks: {
    stapleName: "Highball (ハイボール) / Lemon Sour",
    stapleRatioDefaults: { spirit: 25, mixer: 75 },
    spiritName: "ウイスキー / 焼酎 (Shochu)",
    mixerName: "強炭酸水 / 割り材",
  },

  slang: {
    party: "飲み会 (nomikai)",
    drinking: "飲む / 乾杯 (kanpai)",
    hangover: "二日酔い (futsukayoi)",
    moneyUnit: "円 (yenes)",
    friendGroup: "いつものメンツ",
    splitBill: "割り勘 (warikan)",
    signatureDrink: "ハイボール / レモンサワー",
  },

  typicalDrinks: [
    {
      id: "kaku_highball",
      name: "角ハイボール (Kaku Highball 8%)",
      shortName: "ハイボール",
      category: "coctel",
      standardAbv: 0.08,
      defaultServingMl: 350,
      alcoholMlPerServing: 22.4,
      mixerRatio: 3,
      description: "サントリー角瓶ウイスキーをソーダで割った日本の定番居酒屋ドリンク。",
    },
    {
      id: "nama_beer",
      name: "生ビール中ジョッキ (Draft Beer 5%)",
      shortName: "生ビール",
      category: "cerveza",
      standardAbv: 0.05,
      defaultServingMl: 400,
      alcoholMlPerServing: 16.0,
      description: "スーパードライ、一番搾り、ヱビスなどの生中。",
    },
    {
      id: "lemon_sour",
      name: "こだわり酒場のレモンサワー (Lemon Sour 7%)",
      shortName: "レモンサワー",
      category: "coctel",
      standardAbv: 0.07,
      defaultServingMl: 350,
      alcoholMlPerServing: 19.6,
      description: "焼酎またはウォッカベースに生搾りレモンと強炭酸。",
    },
    {
      id: "nihonshu_sake",
      name: "日本酒一合 (Nihonshu / Sake 180ml, 15%)",
      shortName: "日本酒 (Sake)",
      category: "vino",
      standardAbv: 0.15,
      defaultServingMl: 180,
      alcoholMlPerServing: 21.6,
      description: "純米酒、吟醸酒など冷酒または熱燗（徳利1本）。",
    },
    {
      id: "shochu_oyuwari",
      name: "本格焼酎 (芋/麦) お湯割り・水割り (25%)",
      shortName: "焼酎",
      category: "destilado",
      standardAbv: 0.25,
      defaultServingMl: 100,
      alcoholMlPerServing: 20.0,
      description: "鹿児島・宮崎の本格芋焼酎・麦焼酎をお湯または水で割ったもの。",
    },
  ],

  labels: {
    appTitle: "Tonight",
    tagline: "飲み会コパイロット (Nomikai Copilot)",
    nav: {
      home: "ホーム",
      armar: "買い出し計算",
      juegos: "ゲーム",
      tiempo: "酔い覚まし計算",
      dividir: "割り勘 (Warikan)",
      mitos: "二日酔い対策",
    },
  },
};

export default jpLocale;
