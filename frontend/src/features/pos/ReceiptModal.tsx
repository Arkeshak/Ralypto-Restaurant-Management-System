import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, MessageCircle, Phone, Send, Check } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
import { toast } from "sonner";
import type { CartLine, Totals } from "./cartMath";

export interface ReceiptItem extends CartLine {
  id: string;
  name: string;
  modifiers?: string[];
}

interface ReceiptModalProps {
  isOpen: boolean;
  orderNumber: string;
  tableNumber?: string | number;
  items: ReceiptItem[];
  totals: Totals;
  restaurantName?: string;
  headerNote?: string;
  footerNote?: string;
  onClose: () => void;
  onPrint?: () => void;
}

export function ReceiptModal({
  isOpen,
  orderNumber,
  tableNumber,
  items,
  totals,
  restaurantName = "Ralypto Bistro",
  headerNote = "Galle Road, Colombo 03 · Tel: +94 11 234 5678",
  footerNote = "Thank you for dining with us! Powered by Ralypto Restaurant OS",
  onClose,
  onPrint,
}: ReceiptModalProps) {
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    onPrint?.();
    window.print();
  };

  const currentDate = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Build plain text for WhatsApp and SMS sharing
  const buildReceiptText = () => {
    const lines = [
      `🧾 *${restaurantName}*`,
      `Order: #${orderNumber} | ${tableNumber ? `Table T${tableNumber}` : "Takeaway"}`,
      `Date: ${currentDate}`,
      `--------------------------------`,
      ...items.map((i) => `${i.qty}x ${i.name} - ${formatMoney(i.priceCents * i.qty)}`),
      `--------------------------------`,
      `Subtotal: ${formatMoney(totals.subtotal)}`,
    ];
    if (totals.discount > 0) {
      lines.push(`Discount: -${formatMoney(totals.discount)}`);
    }
    if (totals.service > 0) {
      lines.push(`Service Charge: +${formatMoney(totals.service)}`);
    }
    if (totals.tax > 0) {
      lines.push(`Govt Tax: +${formatMoney(totals.tax)}`);
    }
    lines.push(`*TOTAL: ${formatMoney(totals.total)}*`);
    lines.push(`--------------------------------`);
    lines.push(`Thank you for dining with us! 🙏`);
    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    const text = buildReceiptText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("WhatsApp bill link opened");
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim() || customerPhone.length < 9) {
      toast.error("Please enter a valid mobile number (e.g. 0771234567)");
      return;
    }
    setSmsSent(true);
    toast.success(`Digital receipt SMS sent to ${customerPhone}`);
    setTimeout(() => {
      setShowSmsPrompt(false);
      setSmsSent(false);
      setCustomerPhone("");
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
            <span className="text-sm font-bold text-text">80mm Receipt Preview</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 80mm Receipt Thermal Simulation Canvas */}
          <div className="receipt-print-area my-3 flex-1 overflow-y-auto rounded-xl border border-dashed border-border bg-white p-5 font-mono text-xs text-black shadow-inner leading-relaxed select-all">
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-bold uppercase tracking-tight">{restaurantName}</h2>
              <p className="text-[11px] text-zinc-600">{headerNote}</p>
              <div className="mt-2 text-[11px] flex justify-between font-semibold">
                <span>Order: #{orderNumber}</span>
                <span>{tableNumber ? `Table T${tableNumber}` : "Direct Takeaway"}</span>
              </div>
              <p className="text-[10px] text-zinc-500 text-left mt-0.5">{currentDate}</p>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[11px]">
                <span>ITEM</span>
                <span>QTY · AMOUNT</span>
              </div>
              {items.map((item) => (
                <div key={item.id} className="text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-semibold line-clamp-1">{item.name}</span>
                    <span className="tabular-nums">
                      {item.qty} × {formatMoney(item.priceCents)}
                    </span>
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-[10px] text-zinc-500 pl-2">
                      + {item.modifiers.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatMoney(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Discount:</span>
                  <span className="tabular-nums">-{formatMoney(totals.discount)}</span>
                </div>
              )}
              {totals.service > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Service Charge:</span>
                  <span className="tabular-nums">+{formatMoney(totals.service)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Govt Tax:</span>
                  <span className="tabular-nums">+{formatMoney(totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-zinc-300 font-extrabold text-sm">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatMoney(totals.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-zinc-500 leading-tight">
              <p>{footerNote}</p>
            </div>
          </div>

          {/* SMS Prompt Sub-dialog */}
          {showSmsPrompt && (
            <form onSubmit={handleSendSms} className="mb-3 p-3 rounded-xl border border-border bg-bg space-y-2">
              <label className="text-xs font-semibold text-muted block">Customer Mobile Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="07X XXX XXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  autoFocus
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface text-sm font-medium text-text focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  type="submit"
                  disabled={smsSent}
                  className="h-10 px-3 rounded-lg bg-brand text-surface text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                >
                  {smsSent ? <Check className="h-4 w-4" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{smsSent ? "Sent" : "Send"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Digital Share Row: WhatsApp & SMS */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="h-11 rounded-xl border border-border bg-surface hover:bg-bg text-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSmsPrompt((prev) => !prev)}
              className="h-11 rounded-xl border border-border bg-surface hover:bg-bg text-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Phone className="h-4 w-4 text-brand" />
              <span>SMS Bill</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            <BigButton
              label="Close"
              variant="secondary"
              full
              onClick={onClose}
            />
            <BigButton
              label="Print (80mm)"
              icon={Printer}
              variant="primary"
              full
              onClick={handlePrint}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
