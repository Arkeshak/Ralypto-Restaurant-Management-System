import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote, QrCode, CheckCircle2, Split } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";

interface PaymentModalProps {
  isOpen: boolean;
  totalCents: number;
  onClose: () => void;
  onConfirmPayment: (method: "cash" | "card" | "qr_code" | "split", tenderedCents?: number) => void;
}

export function PaymentModal({
  isOpen,
  totalCents,
  onClose,
  onConfirmPayment,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"cash" | "card" | "qr_code" | "split">("cash");
  const [tenderedCents, setTenderedCents] = useState<number>(totalCents);
  const [splitAmountCents, setSplitAmountCents] = useState<number>(Math.round(totalCents / 2));

  if (!isOpen) return null;

  const changeCents = Math.max(0, tenderedCents - totalCents);

  const quickAmounts = [
    { label: "Exact", cents: totalCents },
    { label: "Rs. 1,000", cents: 100000 },
    { label: "Rs. 2,000", cents: 200000 },
    { label: "Rs. 5,000", cents: 500000 },
    { label: "Rs. 10,000", cents: 1000000 },
  ];

  const handleSettle = () => {
    onConfirmPayment(method, method === "cash" ? tenderedCents : totalCents);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Bill Settlement</span>
              <h3 className="text-2xl font-bold tracking-tight text-text">Settle Payment</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Total Due Banner */}
          <div className="my-5 rounded-2xl bg-brand-soft p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Amount Due</span>
            <div className="text-3xl font-extrabold tabular-nums text-brand mt-0.5">
              {formatMoney(totalCents)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMethod("cash")}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                method === "cash"
                  ? "border-brand bg-brand text-surface"
                  : "border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              <Banknote className="h-5 w-5" />
              Cash
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                method === "card"
                  ? "border-brand bg-brand text-surface"
                  : "border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Card
            </button>
            <button
              type="button"
              onClick={() => setMethod("qr_code")}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                method === "qr_code"
                  ? "border-brand bg-brand text-surface"
                  : "border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              <QrCode className="h-5 w-5" />
              QR / App
            </button>
            <button
              type="button"
              onClick={() => setMethod("split")}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                method === "split"
                  ? "border-brand bg-brand text-surface"
                  : "border-border bg-surface text-text hover:bg-bg"
              }`}
            >
              <Split className="h-5 w-5" />
              Split
            </button>
          </div>

          {/* Cash details with quick amount pills and big change text */}
          {method === "cash" && (
            <div className="space-y-4 rounded-xl border border-border p-4 bg-bg/50">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Quick Tendered Buttons
              </label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setTenderedCents(q.cents)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      tenderedCents === q.cents
                        ? "bg-brand text-surface"
                        : "border border-border bg-surface text-text hover:bg-bg"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs text-muted block mb-1">Cash Tendered</span>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-muted">Rs.</span>
                    <input
                      type="number"
                      value={tenderedCents / 100}
                      onChange={(e) => setTenderedCents(Math.round(parseFloat(e.target.value || "0") * 100))}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-surface text-lg font-bold tabular-nums text-text focus:outline-none focus:ring-2 focus:ring-info"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center rounded-lg bg-surface border border-border px-3 py-1">
                  <span className="text-xs text-muted">Change to Return</span>
                  <span className="text-2xl font-extrabold tabular-nums text-success">
                    {formatMoney(changeCents)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Split Payment */}
          {method === "split" && (
            <div className="space-y-3 rounded-xl border border-border p-4 bg-bg/50">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Split 1: Cash / Card
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={splitAmountCents / 100}
                  onChange={(e) => setSplitAmountCents(Math.round(parseFloat(e.target.value || "0") * 100))}
                  className="w-1/2 h-11 px-3 rounded-lg border border-border bg-surface text-lg font-bold tabular-nums text-text"
                />
                <div className="w-1/2 text-sm text-muted">
                  Remaining Split 2: <b>{formatMoney(Math.max(0, totalCents - splitAmountCents))}</b>
                </div>
              </div>
            </div>
          )}

          {/* Settle Action */}
          <div className="mt-6 flex gap-3">
            <BigButton
              label="Cancel"
              variant="secondary"
              full
              onClick={onClose}
            />
            <BigButton
              label="Complete Payment"
              icon={CheckCircle2}
              variant="primary"
              full
              onClick={handleSettle}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
