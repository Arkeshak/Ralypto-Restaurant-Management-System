import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote, QrCode, CheckCircle2, Split, Check } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
import { splitEqual } from "./cartMath";
import type { CartItem } from "./OrderCartPanel";

interface PaymentModalProps {
  isOpen: boolean;
  totalCents: number;
  items?: CartItem[];
  onClose: () => void;
  onConfirmPayment: (paymentResult: {
    method: "cash" | "card" | "qr_code" | "mixed" | "split";
    tenderedCents?: number;
    changeCents?: number;
    cashCents?: number;
    cardCents?: number;
    splitType?: "equal" | "item";
    splitPart?: number;
    splitTotalParts?: number;
    paidAmountCents: number;
  }) => void;
}

export function PaymentModal({
  isOpen,
  totalCents,
  items = [],
  onClose,
  onConfirmPayment,
}: PaymentModalProps) {
  // Main mode: single, mixed (cash+card), split (equal or by item)
  const [activeTab, setActiveTab] = useState<"single" | "mixed" | "split">("single");

  // Single payment state
  const [singleMethod, setSingleMethod] = useState<"cash" | "card" | "qr_code">("cash");
  const [tenderedCents, setTenderedCents] = useState<number>(totalCents);

  // Mixed payment state (Cash portion + Card portion)
  const [mixedCashRupees, setMixedCashRupees] = useState<string>(
    String(Math.floor(totalCents / 200))
  );

  // Split bill state
  const [splitMode, setSplitMode] = useState<"equal" | "item">("equal");
  const [equalParts, setEqualParts] = useState<number>(2);
  const [currentPartPaidIndex, setCurrentPartPaidIndex] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(items.map((i) => i.id));

  if (!isOpen) return null;

  // Single payment calculations
  const changeCents = Math.max(0, tenderedCents - totalCents);

  // Mixed payment calculations
  const mixedCashCents = Math.min(totalCents, (parseInt(mixedCashRupees || "0", 10) || 0) * 100);
  const mixedCardCents = Math.max(0, totalCents - mixedCashCents);

  // Split equal calculations
  const equalSplits = splitEqual(totalCents, equalParts);
  const currentEqualPartCents = equalSplits[currentPartPaidIndex] || equalSplits[0];

  // Split by item calculations
  const selectedItemsSubtotalCents = items
    .filter((i) => selectedItemIds.includes(i.id))
    .reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  // Pro-rate total for selected items
  const totalItemSubtotal = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const selectedItemsTotalCents =
    totalItemSubtotal > 0
      ? Math.round((selectedItemsSubtotalCents / totalItemSubtotal) * totalCents)
      : totalCents;

  const quickCashAmounts = [
    { label: "Exact", cents: totalCents },
    { label: "Rs. 1,000", cents: 100000 },
    { label: "Rs. 2,000", cents: 200000 },
    { label: "Rs. 5,000", cents: 500000 },
    { label: "Rs. 10,000", cents: 1000000 },
  ];

  const handleSettle = () => {
    if (activeTab === "single") {
      onConfirmPayment({
        method: singleMethod,
        tenderedCents: singleMethod === "cash" ? tenderedCents : totalCents,
        changeCents: singleMethod === "cash" ? changeCents : 0,
        paidAmountCents: totalCents,
      });
    } else if (activeTab === "mixed") {
      onConfirmPayment({
        method: "mixed",
        cashCents: mixedCashCents,
        cardCents: mixedCardCents,
        paidAmountCents: totalCents,
      });
    } else {
      // Split
      if (splitMode === "equal") {
        onConfirmPayment({
          method: "split",
          splitType: "equal",
          splitPart: currentPartPaidIndex + 1,
          splitTotalParts: equalParts,
          paidAmountCents: currentEqualPartCents,
        });
      } else {
        onConfirmPayment({
          method: "split",
          splitType: "item",
          paidAmountCents: selectedItemsTotalCents,
        });
      }
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/40 shrink-0">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                POS Bill Settlement
              </span>
              <h3 className="text-xl font-bold tracking-tight text-text">Settle Payment</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 grid grid-cols-3 p-1 rounded-2xl bg-bg border border-border shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "single"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <Banknote className="h-4 w-4" /> Single
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mixed")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "mixed"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <CreditCard className="h-4 w-4" /> Cash + Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("split")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "split"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <Split className="h-4 w-4" /> Split Bill
            </button>
          </div>

          {/* Total Due Banner */}
          <div className="my-4 rounded-2xl bg-bg border border-border p-3.5 text-center shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Total Amount Due
            </span>
            <div className="text-3xl font-extrabold tabular-nums text-text mt-0.5">
              {formatMoney(totalCents)}
            </div>
          </div>

          {/* 1. SINGLE PAYMENT MODE */}
          {activeTab === "single" && (
            <div className="space-y-4">
              {/* Method Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSingleMethod("cash")}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    singleMethod === "cash"
                      ? "border-brand bg-brand text-surface shadow-sm"
                      : "border-border bg-surface text-text hover:bg-bg"
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSingleMethod("card")}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    singleMethod === "card"
                      ? "border-brand bg-brand text-surface shadow-sm"
                      : "border-border bg-surface text-text hover:bg-bg"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSingleMethod("qr_code")}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    singleMethod === "qr_code"
                      ? "border-brand bg-brand text-surface shadow-sm"
                      : "border-border bg-surface text-text hover:bg-bg"
                  }`}
                >
                  <QrCode className="h-5 w-5" />
                  <span>LankaQR</span>
                </button>
              </div>

              {/* Cash Options */}
              {singleMethod === "cash" && (
                <div className="space-y-3 rounded-2xl border border-border p-4 bg-bg/50">
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashAmounts.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setTenderedCents(q.cents)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors ${
                          tenderedCents === q.cents
                            ? "bg-brand text-surface"
                            : "border border-border bg-surface text-text hover:bg-bg"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-xs text-muted block mb-1">Cash Tendered</span>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-muted">
                          Rs.
                        </span>
                        <input
                          type="number"
                          value={tenderedCents / 100}
                          onChange={(e) =>
                            setTenderedCents(
                              Math.round(parseFloat(e.target.value || "0") * 100)
                            )
                          }
                          className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-surface text-base font-bold tabular-nums text-text focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center rounded-xl bg-surface border border-border px-3 py-2">
                      <span className="text-[11px] text-muted">Change to Return</span>
                      <span className="text-xl font-bold tabular-nums text-emerald-600">
                        {formatMoney(changeCents)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MIXED PAYMENT MODE (Cash + Card in one bill) */}
          {activeTab === "mixed" && (
            <div className="space-y-4 rounded-2xl border border-border p-4 bg-bg/50">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted block">
                  1. Cash Amount to Pay
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-muted">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    max={totalCents / 100}
                    value={mixedCashRupees}
                    onChange={(e) => setMixedCashRupees(e.target.value)}
                    placeholder="Enter cash portion..."
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-surface text-base font-bold tabular-nums text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Dynamic Remaining Balance for Card */}
              <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block">2. Remaining for Card:</span>
                  <span className="text-lg font-bold text-brand block">
                    {formatMoney(mixedCardCents)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-muted">
                  <span>Cash: {formatMoney(mixedCashCents)}</span>
                  <br />
                  <span>Card: {formatMoney(mixedCardCents)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. SPLIT BILL MODE */}
          {activeTab === "split" && (
            <div className="space-y-4">
              {/* Split Submode Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-bg border border-border">
                <button
                  type="button"
                  onClick={() => setSplitMode("equal")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    splitMode === "equal"
                      ? "bg-surface text-text shadow-sm"
                      : "text-muted hover:text-text"
                  }`}
                >
                  Split Equally (2, 3, 4...)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("item")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    splitMode === "item"
                      ? "bg-surface text-text shadow-sm"
                      : "text-muted hover:text-text"
                  }`}
                >
                  Split by Selected Items
                </button>
              </div>

              {splitMode === "equal" ? (
                <div className="space-y-3 rounded-2xl border border-border p-4 bg-bg/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">Number of Parts:</span>
                    <div className="flex gap-1.5">
                      {[2, 3, 4, 5, 6].map((parts) => (
                        <button
                          key={parts}
                          type="button"
                          onClick={() => {
                            setEqualParts(parts);
                            setCurrentPartPaidIndex(0);
                          }}
                          className={`h-9 w-9 rounded-xl border text-xs font-bold transition-all ${
                            equalParts === parts
                              ? "bg-brand text-surface border-brand"
                              : "bg-surface text-text border-border hover:bg-bg"
                          }`}
                        >
                          {parts}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Part Selector Pills */}
                  <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
                    <span className="text-xs text-muted block">Select Part to Pay:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {equalSplits.map((amt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPartPaidIndex(idx)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all ${
                            currentPartPaidIndex === idx
                              ? "border-brand bg-brand/5 text-brand font-bold"
                              : "border-border bg-bg text-text"
                          }`}
                        >
                          <div>Part {idx + 1} of {equalParts}</div>
                          <div className="font-extrabold">{formatMoney(amt)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Split by Item Checklist */
                <div className="space-y-2 rounded-2xl border border-border p-3.5 bg-bg/50 max-h-48 overflow-y-auto">
                  <span className="text-xs font-semibold text-muted block mb-1">
                    Select items for this payment:
                  </span>
                  {items.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItemSelection(item.id)}
                        className={`w-full p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? "bg-surface border-brand text-text font-semibold"
                            : "bg-bg/80 border-border text-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                              isSelected ? "bg-brand text-surface border-brand" : "border-border"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>
                            {item.qty}x {item.name}
                          </span>
                        </div>
                        <span className="tabular-nums font-bold">
                          {formatMoney(item.priceCents * item.qty)}
                        </span>
                      </button>
                    );
                  })}
                  <div className="pt-2 border-t border-border flex justify-between text-xs font-bold text-text">
                    <span>Selected Total (with tax/service):</span>
                    <span>{formatMoney(selectedItemsTotalCents)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-2 shrink-0">
            <BigButton label="Cancel" variant="secondary" full onClick={onClose} />
            <BigButton
              label={
                activeTab === "split"
                  ? `Pay Split (${formatMoney(
                      splitMode === "equal" ? currentEqualPartCents : selectedItemsTotalCents
                    )})`
                  : `Complete Payment (${formatMoney(totalCents)})`
              }
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
