"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Receipt, 
  Users, 
  CreditCard, 
  Plus, 
  Minus, 
  Percent, 
  Truck, 
  Save, 
  CheckCircle2, 
  Copy, 
  Building2,
  DollarSign,
} from "lucide-react";
import clLocale, { COMMON_BANKS_CL, ACCOUNT_TYPES_CL } from "@/config/locales/cl";
import { COMMON_BANKS_MX } from "@/config/locales/mx";
import { COMMON_BANKS_JP } from "@/config/locales/jp";
import { useLocale } from "@/lib/useLocale";
import WhatsAppShare from "@/components/ui/WhatsAppShare";

interface BankDetails {
  bank: string;
  accountType: string;
  accountNumber: string;
  rut: string;
  holderName: string;
  email: string;
  // Multi-country fields
  clabe?: string;
  concept?: string;
  venmo?: string;
  zelle?: string;
  cashapp?: string;
  paypayId?: string;
  linePay?: string;
}

export default function SplitBill() {
  const { locale } = useLocale();
  const [totalSpent, setTotalSpent] = useState<string>("45000");
  const [peopleCount, setPeopleCount] = useState<number>(6);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<string>("0");
  const [includePayer, setIncludePayer] = useState<boolean>(true);
  const [soberDriversCount, setSoberDriversCount] = useState<number>(1);
  const [alcoholPortionPercent, setAlcoholPortionPercent] = useState<number>(70); // 70% of bill is alcohol
  const [includeSafeRideFund, setIncludeSafeRideFund] = useState<boolean>(false); // safe ride fund
  const [copiedBankPayload, setCopiedBankPayload] = useState<boolean>(false);

  // Bank transfer info for the person who paid
  const [bankInfo, setBankInfo] = useState<BankDetails>({
    bank: "BancoEstado (CuentaRUT)",
    accountType: "CuentaRUT / Vista",
    accountNumber: "",
    rut: "",
    holderName: "",
    email: "",
  });

  const [savedLocally, setSavedLocally] = useState<boolean>(false);

  // Load stored bank info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tonight_saved_bank_details");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBankInfo((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Could not load stored bank details", e);
    }
  }, []);

  const handleSaveBankInfo = () => {
    try {
      localStorage.setItem("tonight_saved_bank_details", JSON.stringify(bankInfo));
      setSavedLocally(true);
      setTimeout(() => setSavedLocally(false), 2500);
    } catch (e) {
      console.error("Could not save bank details", e);
    }
  };

  // Calculations
  const calculation = useMemo(() => {
    const rawTotal = Number(totalSpent.replace(/\D/g, "")) || 0;
    const rawDelivery = Number(deliveryFee.replace(/\D/g, "")) || 0;
    const totalPeople = Math.max(1, peopleCount || 1);
    const drivers = Math.min(soberDriversCount, Math.max(0, totalPeople - 1));
    const drinkers = Math.max(1, totalPeople - drivers);

    const tipAmount = Math.round((rawTotal * tipPercentage) / 100);
    const safeRideTotal = includeSafeRideFund ? totalPeople * 2000 : 0;
    const grandTotal = rawTotal + tipAmount + rawDelivery + safeRideTotal;

    // Split alcohol and non-alcohol expenses
    const alcoholTotal = Math.round((rawTotal * alcoholPortionPercent) / 100);
    const nonAlcoholTotal = rawTotal - alcoholTotal + tipAmount + rawDelivery + safeRideTotal;

    // Base cost per person for shared supplies & safe ride
    const baseSharedPerPerson = Math.ceil(nonAlcoholTotal / totalPeople);

    // Alcohol portion divided only among drinkers
    const alcoholPerDrinker = drinkers > 0 ? Math.ceil(alcoholTotal / drinkers) : 0;

    const drinkerPerPerson = baseSharedPerPerson + alcoholPerDrinker;
    const driverPerPerson = baseSharedPerPerson;

    return {
      rawTotal,
      tipAmount,
      deliveryFee: rawDelivery,
      safeRideTotal,
      grandTotal,
      totalPeople,
      drinkers,
      drivers,
      drinkerPerPerson,
      driverPerPerson,
      alcoholTotal,
      nonAlcoholTotal,
    };
  }, [totalSpent, peopleCount, tipPercentage, deliveryFee, soberDriversCount, alcoholPortionPercent, includeSafeRideFund]);

  // Banking string payload for quick copy
  const bankCompactPayload = useMemo(() => {
    if (locale.countryCode === "MX") {
      const parts = [
        `Monto: ${locale.currency.format(calculation.drinkerPerPerson)}`,
        bankInfo.holderName ? `Beneficiario: ${bankInfo.holderName}` : "",
        bankInfo.clabe ? `CLABE: ${bankInfo.clabe}` : "",
        bankInfo.bank ? `Banco: ${bankInfo.bank}` : "",
        `Concepto: ${bankInfo.concept || "Peda Tonight"}`,
      ].filter(Boolean);
      return parts.join(" | ");
    } else if (locale.countryCode === "US") {
      const parts = [
        `Amount: ${locale.currency.format(calculation.drinkerPerPerson)}`,
        bankInfo.holderName ? `Name: ${bankInfo.holderName}` : "",
        bankInfo.venmo ? `Venmo: ${bankInfo.venmo}` : "",
        bankInfo.zelle ? `Zelle: ${bankInfo.zelle}` : "",
        bankInfo.cashapp ? `CashApp: ${bankInfo.cashapp}` : "",
      ].filter(Boolean);
      return parts.join(" | ");
    } else if (locale.countryCode === "JP") {
      const parts = [
        `金額: ${locale.currency.format(calculation.drinkerPerPerson)}`,
        bankInfo.holderName ? `幹事: ${bankInfo.holderName}` : "",
        bankInfo.paypayId ? `PayPay: ${bankInfo.paypayId}` : "",
        bankInfo.linePay ? `LinePay: ${bankInfo.linePay}` : "",
        bankInfo.bank ? `銀行: ${bankInfo.bank}` : "",
      ].filter(Boolean);
      return parts.join(" | ");
    }

    // Default Chile
    const parts = [
      `Monto: ${locale.currency.format(calculation.drinkerPerPerson)}`,
      bankInfo.holderName ? `Nombre: ${bankInfo.holderName}` : "",
      bankInfo.rut ? `RUT: ${bankInfo.rut}` : "",
      bankInfo.bank ? `${bankInfo.bank} (${bankInfo.accountType})` : "",
      bankInfo.accountNumber ? `N°: ${bankInfo.accountNumber}` : "",
      bankInfo.email ? `Email: ${bankInfo.email}` : "",
      `Asunto: Carrete Tonight`,
    ].filter(Boolean);
    return parts.join(" | ");
  }, [calculation.drinkerPerPerson, bankInfo, locale]);

  const handleCopyBankPayload = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bankCompactPayload).then(() => {
        setCopiedBankPayload(true);
        setTimeout(() => setCopiedBankPayload(false), 2000);
      });
    }
  };

  // WhatsApp formatted string
  const whatsAppMessage = useMemo(() => {
    const partyUpper = (locale.terminology.partyName || "CARRETE").toUpperCase();
    let msg = `💸 *CUOTA DE LA ${partyUpper}* ${locale.flag}\n\n`;
    msg += `📊 *Total compras:* ${locale.currency.format(calculation.grandTotal)}\n`;
    if (calculation.tipAmount > 0) {
      msg += `• Propina (${tipPercentage}%): ${locale.currency.format(calculation.tipAmount)}\n`;
    }
    if (calculation.deliveryFee > 0) {
      msg += `• Delivery / Envío: ${locale.currency.format(calculation.deliveryFee)}\n`;
    }
    if (calculation.safeRideTotal > 0) {
      msg += `• Fondo Transporte Seguro: ${locale.currency.format(calculation.safeRideTotal)}\n`;
    }
    msg += `👥 *Total asistentes:* ${calculation.totalPeople} personas\n\n`;

    if (calculation.drivers > 0) {
      msg += `🍻 *Cuota Quienes Beben (${calculation.drinkers} pers):* *${locale.currency.format(calculation.drinkerPerPerson)}*\n`;
      msg += `🚗 *${locale.terminology.driverTitle} (${calculation.drivers} pers - Exento de alcohol):* *${locale.currency.format(calculation.driverPerPerson)}*\n\n`;
    } else {
      msg += `💰 *CUOTA POR PERSONA:* *${locale.currency.format(calculation.drinkerPerPerson)}*\n\n`;
    }

    if (locale.countryCode === "MX" && (bankInfo.clabe || bankInfo.holderName)) {
      msg += `💳 *DATOS DE TRANSFERENCIA SPEI (MÉXICO):*\n`;
      if (bankInfo.holderName) msg += `• *Beneficiario:* ${bankInfo.holderName}\n`;
      if (bankInfo.clabe) msg += `• *CLABE (18 dígitos):* ${bankInfo.clabe}\n`;
      if (bankInfo.bank) msg += `• *Banco:* ${bankInfo.bank}\n`;
      msg += `• *Concepto:* ${bankInfo.concept || "Peda Tonight"}\n`;
    } else if (locale.countryCode === "US" && (bankInfo.venmo || bankInfo.zelle || bankInfo.cashapp)) {
      msg += `💳 *PAYMENT INFO (US):*\n`;
      if (bankInfo.holderName) msg += `• *Host:* ${bankInfo.holderName}\n`;
      if (bankInfo.venmo) msg += `• *Venmo:* ${bankInfo.venmo}\n`;
      if (bankInfo.zelle) msg += `• *Zelle:* ${bankInfo.zelle}\n`;
      if (bankInfo.cashapp) msg += `• *Cash App:* ${bankInfo.cashapp}\n`;
    } else if (locale.countryCode === "JP" && (bankInfo.paypayId || bankInfo.linePay)) {
      msg += `🍶 *割り勘 送金先 (JAPÓN):*\n`;
      if (bankInfo.holderName) msg += `• *幹事:* ${bankInfo.holderName}\n`;
      if (bankInfo.paypayId) msg += `• *PayPay ID:* ${bankInfo.paypayId}\n`;
      if (bankInfo.linePay) msg += `• *Line Pay:* ${bankInfo.linePay}\n`;
      if (bankInfo.bank) msg += `• *銀行:* ${bankInfo.bank}\n`;
    } else if (bankInfo.holderName || bankInfo.rut || bankInfo.accountNumber) {
      msg += `💳 *DATOS DE TRANSFERENCIA:*\n`;
      if (bankInfo.holderName) msg += `• *Nombre:* ${bankInfo.holderName}\n`;
      if (bankInfo.rut) msg += `• *RUT:* ${bankInfo.rut}\n`;
      if (bankInfo.bank) msg += `• *Banco:* ${bankInfo.bank}\n`;
      if (bankInfo.accountType) msg += `• *Tipo:* ${bankInfo.accountType}\n`;
      if (bankInfo.accountNumber) msg += `• *N° Cuenta:* ${bankInfo.accountNumber}\n`;
      if (bankInfo.email) msg += `• *Email:* ${bankInfo.email}\n`;
    } else {
      msg += `📲 _Pídele los datos de transferencia a quien pagó para depositar su cuota._\n`;
    }

    msg += `\n✨ _Calculado con Tonight (${locale.labels?.tagline || "Copiloto Social"} ${locale.flag})_`;
    return msg;
  }, [calculation, tipPercentage, bankInfo, locale]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-night-900 to-night-850 p-5 rounded-3xl border border-emerald-500/20 shadow-glow-accent">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Dividir Cuenta ({locale.countryName})</h1>
            <p className="text-xs text-slate-400">
              Cobra la cuota rápido a {locale.slang?.friendGroup || "los amigos"} con cobro directo para WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Main Expense Inputs */}
      <div className="glass-panel p-5 rounded-3xl space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>1. Gastos de la Noche</span>
        </h2>

        {/* Monto Total */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Monto total gastado en compras</span>
            <span className="text-[11px] text-slate-400 font-normal">En {locale.currency.slangName} ({locale.currency.code})</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-extrabold text-base">
              {locale.currency.symbol}
            </span>
            <input
              type="text"
              value={totalSpent}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setTotalSpent(raw ? Number(raw).toLocaleString("es-CL") : "");
              }}
              placeholder="Ej: 45.000"
              className="w-full min-h-[52px] bg-night-900 border border-night-700 rounded-2xl pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Personas */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>¿Entre cuántos se divide?</span>
            </label>
            <span className="text-base font-extrabold text-white px-3 py-1 rounded-xl bg-night-800 border border-night-700">
              {peopleCount} personas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
              className="w-12 h-12 rounded-2xl bg-night-850 hover:bg-night-800 border border-night-700 flex items-center justify-center text-slate-200 active:scale-95 text-lg font-bold"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={peopleCount}
              onChange={(e) => setPeopleCount(Number(e.target.value))}
              className="flex-1 h-2 bg-night-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              type="button"
              onClick={() => setPeopleCount((p) => p + 1)}
              className="w-12 h-12 rounded-2xl bg-night-850 hover:bg-night-800 border border-night-700 flex items-center justify-center text-slate-200 active:scale-95 text-lg font-bold"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Extras: Propina y Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Propina */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-night-900 border border-night-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Propina voluntaria</span>
            </label>
            <div className="flex gap-1.5">
              {[0, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipPercentage(pct)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tipPercentage === pct
                      ? "bg-amber-500/20 border border-amber-500/60 text-amber-300"
                      : "bg-night-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-night-900 border border-night-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-carrete-primary" />
              <span>Costo delivery / taxi</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                $
              </span>
              <input
                type="text"
                value={deliveryFee}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setDeliveryFee(raw ? Number(raw).toLocaleString("es-CL") : "0");
                }}
                placeholder="0"
                className="w-full bg-night-850 border border-night-700 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-carrete-primary"
              />
            </div>
          </div>
        </div>

        {/* Cuidado & División Inteligente V5 */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <span>🚗 Conductor Designado Exento de Alcohol</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoberDriversCount(Math.max(0, soberDriversCount - 1))}
                className="w-7 h-7 rounded-lg bg-night-900 text-slate-300 font-bold border border-night-700 flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="text-xs font-extrabold text-white">
                {soberDriversCount} {soberDriversCount === 1 ? "persona" : "personas"}
              </span>
              <button
                type="button"
                onClick={() => setSoberDriversCount(soberDriversCount + 1)}
                className="w-7 h-7 rounded-lg bg-night-900 text-slate-300 font-bold border border-night-700 flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Safe Ride Fund Toggle */}
          <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200 block">Fondo Auto Seguro (+$2.000 c/u)</span>
              <span className="text-[10px] text-slate-400">
                Pozo común para pagar los Uber de regreso de todos
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeSafeRideFund(!includeSafeRideFund)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                includeSafeRideFund
                  ? "bg-emerald-600 text-white shadow-glow-accent"
                  : "bg-night-900 text-slate-400 border border-night-700"
              }`}
            >
              {includeSafeRideFund ? "Activado ✓" : "Opcional"}
            </button>
          </div>
        </div>
      </div>

      {/* Bank Details Card (Optional but extremely useful for WhatsApp prompt) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>2. Datos de Transferencia (Quien Pagó)</span>
          </h2>
          <button
            type="button"
            onClick={handleSaveBankInfo}
            className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-night-800 border border-night-700 transition-colors"
          >
            {savedLocally ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Recordar datos</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Se agregarán automáticamente al mensaje de WhatsApp para que nadie tenga excusas de no transferirte.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locale.countryCode === "MX" ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nombre del Beneficiario
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={bankInfo.holderName}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, holderName: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  CLABE Interbancaria (18 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="Ej: 012180001234567890"
                  value={bankInfo.clabe || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, clabe: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Banco (México)
                </label>
                <select
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecciona Banco</option>
                  {COMMON_BANKS_MX.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Concepto de pago sugerido
                </label>
                <input
                  type="text"
                  placeholder="Ej: Peda Tonight"
                  value={bankInfo.concept || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, concept: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : locale.countryCode === "US" ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Host / Organizer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Miller"
                  value={bankInfo.holderName}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, holderName: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Venmo Handle (@)
                </label>
                <input
                  type="text"
                  placeholder="@your-venmo"
                  value={bankInfo.venmo || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, venmo: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Zelle (Phone or Email)
                </label>
                <input
                  type="text"
                  placeholder="555-0199 or name@gmail.com"
                  value={bankInfo.zelle || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, zelle: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Cash App ($cashtag)
                </label>
                <input
                  type="text"
                  placeholder="$yourCashtag"
                  value={bankInfo.cashapp || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, cashapp: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : locale.countryCode === "JP" ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  幹事 (受取人名)
                </label>
                <input
                  type="text"
                  placeholder="例: 田中 太郎"
                  value={bankInfo.holderName}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, holderName: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  PayPay ID
                </label>
                <input
                  type="text"
                  placeholder="例: paypay_id_123"
                  value={bankInfo.paypayId || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, paypayId: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Line Pay
                </label>
                <input
                  type="text"
                  placeholder="例: line_id_nomikai"
                  value={bankInfo.linePay || ""}
                  onChange={(e) => setBankInfo({ ...bankInfo, linePay: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  銀行口座 (送金先)
                </label>
                <select
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">銀行を選択</option>
                  {COMMON_BANKS_JP.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Chile (Default) */
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nombre de quien recibe
                </label>
                <input
                  type="text"
                  placeholder="Ej: Rodrigo González"
                  value={bankInfo.holderName}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, holderName: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  placeholder="Ej: 18.234.567-8"
                  value={bankInfo.rut}
                  onChange={(e) => setBankInfo({ ...bankInfo, rut: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Banco
                </label>
                <select
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {COMMON_BANKS_CL.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={bankInfo.accountType}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountType: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {ACCOUNT_TYPES_CL.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  N° de Cuenta
                </label>
                <input
                  type="text"
                  placeholder="Ej: 18234567 (o RUT para CuentaRUT)"
                  value={bankInfo.accountNumber}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountNumber: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Email para comprobante
                </label>
                <input
                  type="email"
                  placeholder="tu.correo@gmail.com"
                  value={bankInfo.email}
                  onChange={(e) => setBankInfo({ ...bankInfo, email: e.target.value })}
                  className="w-full min-h-[44px] bg-night-900 border border-night-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result Card & Quick Share */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border-emerald-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-night-800 pb-4 gap-3">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {calculation.drivers > 0 ? "Cuota Quienes Beben" : "Cuota por persona"}
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">
              {locale.currency.format(calculation.drinkerPerPerson)}
            </div>
            {calculation.drivers > 0 && (
              <span className="text-xs text-emerald-300 font-bold block mt-1">
                🚗 {locale.terminology.driverTitle}: {locale.currency.format(calculation.driverPerPerson)} (exento de alcohol)
              </span>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total compras + extras
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {locale.currency.format(calculation.grandTotal)}
            </div>
            <span className="text-[11px] text-slate-400">
              {calculation.totalPeople} personas en la reunión
            </span>
          </div>
        </div>

        {/* Direct Bank Copy Payload Button */}
        {bankCompactPayload && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-night-900 border border-slate-700 text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Copia rápida para app ({locale.banking.systemName}):
              </span>
              <span className="font-mono text-slate-200 truncate block text-[11px]">
                {bankCompactPayload}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyBankPayload}
              className="px-3 py-1.5 rounded-xl bg-carrete-primary hover:bg-indigo-500 text-white font-bold shrink-0 transition-all flex items-center gap-1 active:scale-95"
            >
              {copiedBankPayload ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Message preview */}
        <div className="p-3.5 rounded-2xl bg-night-900/90 border border-night-800 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
          {whatsAppMessage}
        </div>

        {/* WhatsApp Share Button */}
        <WhatsAppShare
          textToShare={whatsAppMessage}
          label="Enviar Cobro por WhatsApp"
        />
      </div>
    </div>
  );
}
