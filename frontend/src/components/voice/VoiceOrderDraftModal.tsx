import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Plus, Minus, Trash2, CheckCircle, ArrowRight } from 'lucide-react';
import type { VoiceOrderDraft, VoiceParsedItem } from '../../api/types';
import { formatMoney } from '../../lib/formatMoney';

interface VoiceOrderDraftModalProps {
  draft: VoiceOrderDraft;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedDraft: VoiceOrderDraft) => void;
  confirmLabel?: string;
  availableTables?: Array<{ id: string; number: string }>;
}

export const VoiceOrderDraftModal: React.FC<VoiceOrderDraftModalProps> = ({
  draft,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm & Send to Kitchen',
  availableTables = [],
}) => {
  const [items, setItems] = useState<VoiceParsedItem[]>(draft.items);
  const [selectedTable, setSelectedTable] = useState<string>(draft.tableNumber || '');
  const [addedUpsell, setAddedUpsell] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);

  const updateQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null as any;
          return {
            ...item,
            quantity: nextQty,
            subtotalCents: item.unitPriceCents * nextQty,
          };
        })
        .filter(Boolean)
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddUpsell = () => {
    if (!draft.suggestedUpsell || addedUpsell) return;
    const upsell = draft.suggestedUpsell;
    setItems((prev) => [
      ...prev,
      {
        menuItemId: upsell.menuItemId,
        name: upsell.name,
        quantity: 1,
        unitPriceCents: upsell.priceCents,
        subtotalCents: upsell.priceCents,
        confidence: 1.0,
      },
    ]);
    setAddedUpsell(true);
  };

  const handleConfirm = () => {
    onConfirm({
      ...draft,
      tableNumber: selectedTable || draft.tableNumber,
      items,
    });
    onClose();
  };

  const langNames = {
    en: 'English',
    si: 'සිංහල (Sinhala)',
    ta: 'தமிழ் (Tamil)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Voice Order Draft</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {langNames[draft.language] || draft.language}
                </span>
              </div>
              <p className="text-xs text-zinc-400">AI proposes, staff confirms. Tap to edit any item.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Spoken Quote */}
          <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/60 text-xs">
            <span className="text-zinc-400 font-medium">Heard via Voice: </span>
            <span className="italic text-zinc-200">"{draft.transcript}"</span>
          </div>

          {/* Table Selector */}
          <div className="flex items-center justify-between gap-4 p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
            <label className="text-xs font-semibold text-zinc-300">Target Table</label>
            {availableTables.length > 0 ? (
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-zinc-400"
              >
                <option value="">Select Table...</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.number}>
                    {t.number}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-white bg-zinc-800 px-3 py-1 rounded-xl">
                {selectedTable || 'Takeaway / Quick Order'}
              </span>
            )}
          </div>

          {/* Unrecognized warning if needed */}
          {draft.unrecognizedPhrases.length > 0 && items.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Could not match items from speech. Please select items manually or retry.</span>
            </div>
          )}

          {/* Parsed Items List */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Parsed Items ({items.length})
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No items detected. Try speaking again clearly.
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.menuItemId}-${index}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {Math.round(item.confidence * 100)}% match
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {formatMoney(item.unitPriceCents)} each
                    </div>
                    {item.notes && (
                      <div className="mt-1 text-xs text-amber-400/90 italic">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stepper */}
                    <div className="flex items-center bg-zinc-800 rounded-xl p-1 border border-zinc-700/60">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-20 text-right text-xs font-bold text-white font-mono">
                      {formatMoney(item.subtotalCents)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Smart Upsell Box */}
          {draft.suggestedUpsell && !addedUpsell && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Smart Upsell: {draft.suggestedUpsell.name}
                    <span className="text-amber-400 font-mono">
                      +{formatMoney(draft.suggestedUpsell.priceCents)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">{draft.suggestedUpsell.reason}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddUpsell}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Total Draft Amount</div>
            <div className="text-lg font-black text-white font-mono">{formatMoney(totalCents)}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={items.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                items.length > 0
                  ? 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{confirmLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
