import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
import type { MenuItem, Modifier } from "@/api/types";

interface ModifierSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedModifiers: Modifier[]) => void;
}

export function ModifierSheet({
  item,
  isOpen,
  onClose,
  onConfirm,
}: ModifierSheetProps) {
  const [selectedMods, setSelectedMods] = useState<Modifier[]>([]);

  if (!isOpen || !item) return null;

  const toggleModifier = (mod: Modifier) => {
    setSelectedMods((prev) => {
      const exists = prev.some((m) => m.id === mod.id);
      if (exists) {
        return prev.filter((m) => m.id !== mod.id);
      } else {
        return [...prev, mod];
      }
    });
  };

  const handleAdd = () => {
    onConfirm(item, selectedMods);
    setSelectedMods([]);
    onClose();
  };

  const extraCost = selectedMods.reduce((sum, m) => sum + m.priceDeltaCents, 0);
  const totalItemCost = item.priceCents + extraCost;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-card border border-border bg-surface p-6 shadow-2xl max-h-[85vh] flex flex-col"
        >
          <div className="flex items-start justify-between pb-4 border-b border-border/40 shrink-0">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Customize Dish</span>
              <h3 className="text-xl font-bold tracking-tight text-text mt-0.5">{item.name}</h3>
              <p className="text-sm font-semibold tabular-nums text-muted">{formatMoney(item.priceCents)}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Select Options & Addons
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(item.modifiers || []).map((mod) => {
                const isChecked = selectedMods.some((m) => m.id === mod.id);
                return (
                  <motion.button
                    key={mod.id}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => toggleModifier(mod)}
                    className={`flex min-h-14 items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                      isChecked
                        ? "border-brand bg-brand-soft font-semibold text-text"
                        : "border-border bg-surface text-text hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                          isChecked
                            ? "bg-brand border-brand text-surface"
                            : "border-border bg-surface"
                        }`}
                      >
                        {isChecked && <Check className="h-4 w-4 stroke-[2.5]" />}
                      </div>
                      <span className="text-base font-medium">{mod.name}</span>
                    </div>
                    <span className="text-base font-bold tabular-nums">
                      +{formatMoney(mod.priceDeltaCents)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 shrink-0 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Total with options</span>
              <span className="text-2xl font-bold tabular-nums text-text">
                {formatMoney(totalItemCost)}
              </span>
            </div>
            <BigButton
              label="Add to Order"
              variant="primary"
              size="lg"
              onClick={handleAdd}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
