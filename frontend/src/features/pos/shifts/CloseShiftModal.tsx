import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Printer, CheckCircle, AlertTriangle, AlertCircle, Banknote } from 'lucide-react';
import { useShiftStore } from '@/stores/shift.store';
import { MoneyText } from '@/components/common/MoneyText';
import { BigButton } from '@/components/common/BigButton';
import { toast } from 'sonner';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentShift = useShiftStore((s) => s.currentShift);
  const closeShift = useShiftStore((s) => s.closeShift);

  const [countedStr, setCountedStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentShift) return null;

  const expectedCashCents = currentShift.expectedCashCents || currentShift.openingFloatCents || 0;
  const countedCashCents = (parseInt(countedStr || '0', 10) || 0) * 100;
  const differenceCents = countedCashCents - expectedCashCents;

  const handleDigit = (digit: string) => {
    if (countedStr === '0') {
      setCountedStr(digit);
    } else if (countedStr.length < 8) {
      setCountedStr(countedStr + digit);
    }
  };

  const handleBackspace = () => {
    setCountedStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleMatchExpected = () => {
    setCountedStr(String(Math.round(expectedCashCents / 100)));
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedStr) {
      toast.error('Please enter the counted cash amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await closeShift(countedCashCents, notes);
      toast.success('Shift closed successfully and drawer locked.');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to close shift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Difference status color
  const absDiff = Math.abs(differenceCents);
  let diffBadge = {
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: CheckCircle,
    label: 'Drawer Balanced',
  };

  if (absDiff > 0 && absDiff <= 50000) {
    // Up to LKR 500 difference is amber
    diffBadge = {
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      icon: AlertTriangle,
      label: differenceCents > 0 ? 'Small Cash Surplus' : 'Small Cash Shortage',
    };
  } else if (absDiff > 50000) {
    // Greater than LKR 500 is red
    diffBadge = {
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      icon: AlertCircle,
      label: differenceCents > 0 ? 'Significant Surplus' : 'Significant Shortage',
    };
  }

  const DiffIcon = diffBadge.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl bg-surface border border-border shadow-2xl p-6 text-text flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-brand text-surface flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Close Shift & Cash Drawer</h2>
                <p className="text-xs text-muted">Reconcile drawer balance and generate summary</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Shift Financial Overview */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl border border-border bg-bg/50">
              <span className="text-[11px] font-medium text-muted block">Opening Float</span>
              <span className="text-sm font-bold text-text mt-0.5 block">
                <MoneyText cents={currentShift.openingFloatCents || 0} />
              </span>
            </div>
            <div className="p-3 rounded-2xl border border-border bg-bg/50">
              <span className="text-[11px] font-medium text-muted block">Cash Sales</span>
              <span className="text-sm font-bold text-emerald-600 mt-0.5 block">
                +<MoneyText cents={currentShift.cashSalesCents || 0} />
              </span>
            </div>
            <div className="p-3 rounded-2xl border border-border bg-bg/50">
              <span className="text-[11px] font-medium text-muted block">Card / QR Sales</span>
              <span className="text-sm font-bold text-text mt-0.5 block">
                <MoneyText cents={currentShift.cardSalesCents || 0} />
              </span>
            </div>
          </div>

          {/* Expected vs Counted Comparison */}
          <div className="mt-4 rounded-2xl border border-border bg-bg/70 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted font-medium">Expected Drawer Cash:</span>
              <span className="font-bold text-text text-base">
                <MoneyText cents={expectedCashCents} />
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted font-medium">Counted Drawer Cash:</span>
              <span className="font-bold text-brand text-xl">
                <MoneyText cents={countedCashCents} />
              </span>
            </div>

            {/* Difference indicator */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${diffBadge.color}`}>
              <div className="flex items-center gap-1.5">
                <DiffIcon className="h-4 w-4 shrink-0" />
                <span>{diffBadge.label}</span>
              </div>
              <div className="tabular-nums">
                {differenceCents > 0 ? '+' : ''}
                <MoneyText cents={differenceCents} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Quick Fill Button */}
            <button
              type="button"
              onClick={handleMatchExpected}
              className="w-full py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-bg transition-colors"
            >
              Set Counted to Exact Expected (<MoneyText cents={expectedCashCents} />)
            </button>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleDigit(k)}
                  className="h-11 rounded-xl border border-border bg-surface text-base font-bold text-text hover:bg-bg active:scale-95 transition-all shadow-sm"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl border border-border bg-bg flex items-center justify-center text-muted hover:text-text active:scale-95 transition-all"
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>

            {/* Notes input */}
            <div>
              <input
                type="text"
                placeholder="Optional closing notes or discrepancy reason"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Actions: Print and Close */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintSummary}
                className="h-12 rounded-2xl border border-border bg-surface hover:bg-bg text-text text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <Printer className="h-4 w-4" />
                <span>Print Summary</span>
              </button>
              <BigButton
                type="submit"
                variant="primary"
                full
                loading={isSubmitting}
                label="Confirm & Close"
                icon={CheckCircle}
              />
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
