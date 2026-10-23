import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Percent, Tag, ShieldAlert, Check, Trash2, KeyRound } from 'lucide-react';
import { MoneyText } from '@/components/common/MoneyText';
import { toast } from 'sonner';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalCents: number;
  currentDiscountPercent: number;
  currentDiscountCents: number;
  currentReason: string;
  onApply: (discount: { percent: number; cents: number; reason: string }) => void;
  onRemove: () => void;
}

const COMMON_REASONS = [
  'Regular Guest / Loyalty',
  'Staff / Family Meal',
  'Service Recovery / Goodwill',
  'Promotional Campaign',
  'Management Discretion',
];

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotalCents,
  currentDiscountPercent,
  currentDiscountCents,
  currentReason,
  onApply,
  onRemove,
}) => {
  const [mode, setMode] = useState<'percent' | 'amount'>(
    currentDiscountCents > 0 ? 'amount' : 'percent'
  );
  const [percentVal, setPercentVal] = useState<number>(currentDiscountPercent || 0);
  const [amountRupees, setAmountRupees] = useState<string>(
    currentDiscountCents > 0 ? String(Math.round(currentDiscountCents / 100)) : ''
  );
  const [reason, setReason] = useState<string>(currentReason || '');
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);
  const [managerPin, setManagerPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  if (!isOpen) return null;

  const calculatedDiscountCents =
    mode === 'percent'
      ? Math.round((subtotalCents * percentVal) / 100)
      : (parseInt(amountRupees || '0', 10) || 0) * 100;

  // Threshold requiring manager PIN: > 20% or > LKR 2,000 (200,000 cents)
  const requiresManagerPin =
    (mode === 'percent' && percentVal > 20) ||
    (mode === 'amount' && calculatedDiscountCents > 200000);

  const handleApply = () => {
    if (calculatedDiscountCents <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please select or specify a reason for the discount');
      return;
    }

    if (requiresManagerPin && !showPinPrompt) {
      setShowPinPrompt(true);
      return;
    }

    if (requiresManagerPin) {
      const validPins = ['1111', '2222', '1234'];
      if (!validPins.includes(managerPin)) {
        setPinError('Invalid Manager PIN. (Try 2222 or 1111)');
        return;
      }
    }

    onApply({
      percent: mode === 'percent' ? percentVal : 0,
      cents: mode === 'amount' ? calculatedDiscountCents : 0,
      reason: reason.trim(),
    });

    toast.success('Discount applied to ticket');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 text-text flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-brand text-surface flex items-center justify-center">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Ticket Discount</h2>
                <p className="text-xs text-muted">Apply percentage or fixed cash reduction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!showPinPrompt ? (
            <div className="mt-4 space-y-4">
              {/* Mode Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-bg border border-border">
                <button
                  type="button"
                  onClick={() => setMode('percent')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'percent' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >
                  <Percent className="h-3.5 w-3.5" /> Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('amount')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'amount' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >
                  <Tag className="h-3.5 w-3.5" /> Fixed Amount (LKR)
                </button>
              </div>

              {/* Input section */}
              {mode === 'percent' ? (
                <div>
                  <label className="text-xs font-semibold text-muted mb-2 block">Quick Percent</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPercentVal(p)}
                        className={`h-11 rounded-xl border text-sm font-bold transition-all ${
                          percentVal === p
                            ? 'bg-brand text-surface border-brand'
                            : 'bg-surface text-text border-border hover:bg-bg'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted">Custom %:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentVal || ''}
                      onChange={(e) => setPercentVal(Math.min(100, Math.max(0, Number(e.target.value))))}
                      placeholder="e.g. 25"
                      className="w-24 h-10 px-3 rounded-xl border border-border bg-surface text-sm font-bold text-text focus:outline-none focus:ring-1 focus:ring-brand text-center"
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted mb-2 block">Quick Amount (LKR)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountRupees(String(amt))}
                        className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                          amountRupees === String(amt)
                            ? 'bg-brand text-surface border-brand'
                            : 'bg-surface text-text border-border hover:bg-bg'
                        }`}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted">Custom (LKR):</span>
                    <input
                      type="number"
                      min="0"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="e.g. 1500"
                      className="flex-1 h-10 px-3 rounded-xl border border-border bg-surface text-sm font-bold text-text focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              )}

              {/* Discount Summary Box */}
              <div className="p-3.5 rounded-2xl bg-bg border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block">Discount Deduction:</span>
                  <span className="text-lg font-bold text-emerald-600 block">
                    -<MoneyText cents={calculatedDiscountCents} />
                  </span>
                </div>
                {requiresManagerPin && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-600">
                    <ShieldAlert className="h-3.5 w-3.5" /> Requires Manager PIN (&gt;20%)
                  </div>
                )}
              </div>

              {/* Reason Selector */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1.5 block">Discount Reason</label>
                <div className="space-y-1.5">
                  {COMMON_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        reason === r
                          ? 'bg-brand/5 border-brand text-brand font-semibold'
                          : 'bg-surface border-border text-text hover:bg-bg'
                      }`}
                    >
                      <span>{r}</span>
                      {reason === r && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Or enter custom reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {(currentDiscountPercent > 0 || currentDiscountCents > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemove();
                      toast.info('Discount removed');
                      onClose();
                    }}
                    className="h-12 px-4 rounded-2xl border border-border hover:bg-rose-500/10 hover:text-rose-600 text-muted transition-colors flex items-center justify-center gap-1 text-xs font-semibold"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 h-12 rounded-2xl bg-brand text-surface hover:opacity-95 active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>{requiresManagerPin ? 'Authorize with PIN' : 'Apply Discount'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Manager PIN Auth Step */
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="h-4 w-4" />
                  <span>High Discount Authorization</span>
                </div>
                <p className="mt-1">
                  Discounts exceeding 20% or LKR 2,000 require manager approval. Enter manager PIN to proceed.
                </p>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold text-center">
                  {pinError}
                </div>
              )}

              {/* PIN circles */}
              <div className="flex justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border border-border transition-all ${
                      managerPin.length > i ? 'bg-brand scale-110' : 'bg-bg'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      setPinError('');
                      if (digit === 'C') {
                        setManagerPin('');
                      } else if (managerPin.length < 4) {
                        setManagerPin(managerPin + digit);
                      }
                    }}
                    className="h-12 rounded-2xl border border-border bg-surface text-lg font-bold text-text hover:bg-bg active:scale-95 transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPinError('');
                    setManagerPin((prev) => prev.slice(0, -1));
                  }}
                  className="h-12 rounded-2xl border border-border bg-bg flex items-center justify-center text-muted hover:text-text active:scale-95 transition-all"
                >
                  ⌫
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinPrompt(false)}
                  className="w-1/3 h-12 rounded-2xl border border-border bg-surface text-text text-xs font-semibold hover:bg-bg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={managerPin.length < 4}
                  className="flex-1 h-12 rounded-2xl bg-brand text-surface hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all text-sm font-bold flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Authorize & Apply</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
