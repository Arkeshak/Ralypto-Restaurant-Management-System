import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, ArrowRight, Banknote } from 'lucide-react';
import { useShiftStore } from '@/stores/shift.store';
import { MoneyText } from '@/components/common/MoneyText';
import { BigButton } from '@/components/common/BigButton';
import { toast } from 'sonner';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amountStr, setAmountStr] = useState('10000'); // Default LKR 10,000 in rupees
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const openShift = useShiftStore((s) => s.openShift);

  if (!isOpen) return null;

  const currentFloatCents = (parseInt(amountStr || '0', 10) || 0) * 100;

  const handleDigit = (digit: string) => {
    if (amountStr === '0') {
      setAmountStr(digit);
    } else if (amountStr.length < 7) {
      setAmountStr(amountStr + digit);
    }
  };

  const handleBackspace = () => {
    setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleAddPreset = (rupees: number) => {
    const curr = parseInt(amountStr || '0', 10);
    setAmountStr(String(curr + rupees));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentFloatCents <= 0) {
      toast.error('Please enter a valid opening float amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await openShift(currentFloatCents, notes);
      toast.success('Shift opened successfully! Happy billing.');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to open shift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 text-text flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-brand text-surface flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Open Cash Drawer Shift</h2>
                <p className="text-xs text-muted">Count and enter drawer opening float</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Float Display */}
            <div className="rounded-2xl border border-border bg-bg/50 p-4 text-center">
              <span className="text-xs font-semibold text-muted tracking-wide uppercase">
                Opening Cash Float
              </span>
              <div className="text-3xl font-bold tracking-tight text-text mt-1">
                <MoneyText cents={currentFloatCents} />
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 20000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-bg active:scale-95 transition-all"
                >
                  +{preset.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleDigit(k)}
                  className="h-12 rounded-2xl border border-border bg-surface text-lg font-bold text-text hover:bg-bg active:scale-95 transition-all shadow-sm"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl border border-border bg-bg flex items-center justify-center text-muted hover:text-text active:scale-95 transition-all"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            {/* Notes input */}
            <div>
              <input
                type="text"
                placeholder="Optional shift notes (e.g. morning cash float)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <BigButton
                type="submit"
                variant="primary"
                full
                loading={isSubmitting}
                label="Open Shift & Start Billing"
                icon={ArrowRight}
              />
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
