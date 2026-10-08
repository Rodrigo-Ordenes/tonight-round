"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, X, Sparkles, ShoppingBag, Check } from "lucide-react";
import { CATALOG, type CatalogItem } from "@/lib/basket";
import type { BasketItem } from "@/lib/carreteState";

interface SearchableProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCatalogItem: (item: CatalogItem, quantity: number) => void;
  onAddCustomItem: (item: BasketItem) => void;
}

const CATEGORY_TABS = [
  { id: "all", label: "Todos" },
  { id: "destilados", label: "Destilados" },
  { id: "cervezas", label: "Cervezas" },
  { id: "mezcladores", label: "Mezcladores" },
  { id: "insumos", label: "Insumos & Snacks" },
];

export default function SearchableProductModal({
  isOpen,
  onClose,
  onAddCatalogItem,
  onAddCustomItem,
}: SearchableProductModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom product form state
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("destilados");
  const [customPrice, setCustomPrice] = useState(7990);
  const [customQty, setCustomQty] = useState(1);

  const filteredItems = useMemo(() => {
    return CATALOG.filter((item) => {
      const matchesCat = selectedCat === "all" || item.category === selectedCat;
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [query, selectedCat]);

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: BasketItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      quantity: Math.max(1, customQty),
      unit: "un",
      prices: {
        lider: customPrice,
        jumbo: customPrice,
        botilleria_ref: customPrice,
      },
      customPrice: customPrice,
      custom: true,
    };

    onAddCustomItem(newItem);
    setCustomName("");
    setCustomPrice(7990);
    setCustomQty(1);
    setShowCustomForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[85dvh] flex flex-col rounded-3xl bg-night-900 border border-indigo-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-night-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">
              {showCustomForm ? "Crear Producto Personalizado" : "Buscar en Catálogo Chileno"}
            </h3>
            <p className="text-xs text-slate-400">
              {showCustomForm
                ? "Agrega cualquier licor, snack o insumo con precio propio"
                : "Precios referenciales de supermercados y botillerías"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCustomForm ? (
          /* Formulario de producto personalizado */
          <form onSubmit={handleCreateCustom} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del producto</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej. Fernet Branca 750cc, Tequila José Cuervo..."
                className="w-full min-h-[48px] px-4 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full min-h-[48px] px-3 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none"
                >
                  <option value="destilados">Destilados</option>
                  <option value="cervezas">Cervezas</option>
                  <option value="mezcladores">Mezcladores</option>
                  <option value="insumos">Insumos & Snacks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Precio Unitario (CLP)</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full min-h-[48px] px-3 rounded-xl bg-night-950 border border-slate-700 text-white text-sm font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Cantidad Inicial</label>
              <input
                type="number"
                min={1}
                required
                value={customQty}
                onChange={(e) => setCustomQty(Number(e.target.value))}
                className="w-full min-h-[48px] px-3 rounded-xl bg-night-950 border border-slate-700 text-white text-sm font-mono outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="w-1/2 min-h-[48px] rounded-xl bg-slate-800 text-slate-300 font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-md"
              >
                Guardar a la Canasta
              </button>
            </div>
          </form>
        ) : (
          /* Explorador de catálogo con barra de búsqueda */
          <>
            <div className="p-4 space-y-3 border-b border-night-800">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar pisco, cerveza, hielo, papas, coca..."
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Categorías chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCat(cat.id)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCat === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-night-950 text-slate-400 hover:text-white border border-night-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de productos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50dvh]">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <p className="text-sm">No encontramos "{query}" en el catálogo estándar.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName(query);
                      setShowCustomForm(true);
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-indigo-600/30 text-indigo-300 font-bold text-xs border border-indigo-500/40"
                  >
                    ➕ Crear "{query || "nuevo producto"}" personalizado
                  </button>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-night-950 border border-night-800 hover:border-slate-700 transition-all"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Líder: ${item.prices.lider.toLocaleString("es-CL")} · Jumbo: $
                        {item.prices.jumbo.toLocaleString("es-CL")} · Boti: $
                        {item.prices.botilleria_ref.toLocaleString("es-CL")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onAddCatalogItem(item, 1);
                        onClose();
                      }}
                      className="min-h-[44px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shrink-0 flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer con botón para crear personalizado */}
            <div className="p-3 border-t border-night-800 bg-night-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">¿No encuentras lo que buscas?</span>
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Crear producto personalizado</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
