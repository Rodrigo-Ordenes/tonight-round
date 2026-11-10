"use client";

/** Aviso de borrado con deshacer; va sobre el dock del celular. */
export default function UndoToast({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom,0px))] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/10 bg-night-800 px-4 py-2 text-sm text-slate-200 lg:bottom-6"
    >
      <span className="min-w-0 truncate">{text}</span>
      <button type="button" onClick={onUndo} className="btn-ghost shrink-0 !min-h-[44px] !px-4">
        Deshacer
      </button>
    </div>
  );
}
