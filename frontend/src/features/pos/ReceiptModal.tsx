import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
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
  onClose,
  onPrint,
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    onPrint?.();
    window.print();
  };

  const currentDate = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
            <span className="text-sm font-semibold text-text">80mm Receipt Preview</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-full text-muted hover:text-text hover:bg-bg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 80mm Receipt Thermal Simulation Canvas */}
          <div className="my-3 flex-1 overflow-y-auto rounded-lg border border-dashed border-border bg-white p-5 font-mono text-xs text-black shadow-inner leading-relaxed select-all">
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-bold uppercase tracking-tight">{restaurantName}</h2>
              <p className="text-[11px] text-zinc-600">Galle Road, Colombo 03</p>
              <p className="text-[11px] text-zinc-600">Tel: +94 11 234 5678</p>
              <div className="mt-2 text-[11px] flex justify-between">
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
                  <span>Service Charge (10%):</span>
                  <span className="tabular-nums">+{formatMoney(totals.service)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Govt Tax (10%):</span>
                  <span className="tabular-nums">+{formatMoney(totals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-zinc-300 font-extrabold text-sm">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatMoney(totals.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-zinc-500">
              <p>Thank you for dining with us!</p>
              <p>Powered by Ralypto Restaurant OS</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3 shrink-0">
            <BigButton
              label="Close"
              variant="secondary"
              full
              onClick={onClose}
            />
            <BigButton
              label="Print Bill"
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
