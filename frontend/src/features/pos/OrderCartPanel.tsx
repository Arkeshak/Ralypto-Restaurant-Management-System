import { useState } from "react";
import { Plus, Minus, Trash2, Send, Printer, CreditCard, Pause, AlertOctagon } from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { BigButton } from "@/components/common/BigButton";
import type { CartLine, Totals } from "./cartMath";

export interface CartItem extends CartLine {
  id: string;
  name: string;
  notes?: string;
  modifiers?: Array<{ id: string; name: string; priceDeltaCents: number }>;
}

interface OrderCartPanelProps {
  tableNumber?: string | number;
  items: CartItem[];
  totals: Totals;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSendToKitchen: () => void;
  onPrintBill: () => void;
  onOpenPay: () => void;
  onHoldOrder: () => void;
  onVoidOrder: () => void;
  isSending?: boolean;
}

export function OrderCartPanel({
  tableNumber,
  items,
  totals,
  onUpdateQty,
  onRemoveItem,
  onUpdateNotes,
  onSendToKitchen,
  onPrintBill,
  onOpenPay,
  onHoldOrder,
  onVoidOrder,
  isSending,
}: OrderCartPanelProps) {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col justify-between border-l border-border bg-surface">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/40 p-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">Current Order</h2>
          <span className="text-xs font-semibold text-muted">
            {tableNumber ? `Table T${tableNumber}` : "Direct Takeaway"} · {items.length} items
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onVoidOrder}
            title="Void this entire order"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger-soft transition-colors"
          >
            <AlertOctagon className="h-3.5 w-3.5" /> Void
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-base font-semibold text-text">Order is empty</p>
            <p className="mt-1 text-xs text-muted">Tap menu items to add them to this ticket.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-bg/40 p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-text truncate">{item.name}</h4>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-xs text-muted">
                      + {item.modifiers.map((m) => m.name).join(", ")}
                    </p>
                  )}
                  <span className="text-xs font-bold tabular-nums text-text">
                    {formatMoney(item.priceCents * item.qty)}
                  </span>
                </div>

                {/* Qty +/- Controls */}
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-0.5">
                  <button
                    onClick={() => {
                      if (item.qty === 1) {
                        onRemoveItem(item.id);
                      } else {
                        onUpdateQty(item.id, -1);
                      }
                    }}
                    aria-label="Decrease quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text hover:bg-bg"
                  >
                    {item.qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-danger" /> : <Minus className="h-3.5 w-3.5" />}
                  </button>
                  <span className="w-5 text-center text-sm font-bold tabular-nums text-text">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    aria-label="Increase quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text hover:bg-bg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Line Notes */}
              {editingNotesId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={item.notes || ""}
                    placeholder="E.g. No onions, extra spicy..."
                    onBlur={(e) => {
                      onUpdateNotes(item.id, e.target.value);
                      setEditingNotesId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onUpdateNotes(item.id, e.currentTarget.value);
                        setEditingNotesId(null);
                      }
                    }}
                    autoFocus
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-info"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNotesId(item.id)}
                  className="text-left text-[11px] text-muted hover:text-text truncate"
                >
                  {item.notes ? `Note: "${item.notes}" (click to edit)` : "+ Add kitchen note..."}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Actions Footer */}
      <div className="border-t border-border bg-surface p-4 shrink-0 space-y-3">
        {/* Breakdown */}
        <div className="space-y-1 text-xs font-medium text-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums text-text font-semibold">{formatMoney(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span className="tabular-nums font-semibold">-{formatMoney(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Service Charge (10%)</span>
            <span className="tabular-nums text-text font-semibold">+{formatMoney(totals.service)}</span>
          </div>
          <div className="flex justify-between">
            <span>Govt Tax (10%)</span>
            <span className="tabular-nums text-text font-semibold">+{formatMoney(totals.tax)}</span>
          </div>
        </div>

        {/* Total Price - Apple Big & Confident */}
        <div className="flex items-baseline justify-between pt-2 border-t border-border/40">
          <span className="text-base font-bold text-text">Total</span>
          <span className="text-3xl font-extrabold tabular-nums tracking-tight text-text">
            {formatMoney(totals.total)}
          </span>
        </div>

        {/* Action Buttons Grid */}
        <div className="space-y-2 pt-1">
          {/* Main Primary Button: Send to Kitchen */}
          <BigButton
            label="Send to Kitchen"
            icon={Send}
            variant="primary"
            size="lg"
            full
            loading={isSending}
            disabled={items.length === 0}
            onClick={onSendToKitchen}
          />

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-2">
            <BigButton
              label="Print"
              icon={Printer}
              variant="secondary"
              size="md"
              disabled={items.length === 0}
              onClick={onPrintBill}
            />
            <BigButton
              label="Pay"
              icon={CreditCard}
              variant="secondary"
              size="md"
              disabled={items.length === 0}
              onClick={onOpenPay}
            />
            <BigButton
              label="Hold"
              icon={Pause}
              variant="secondary"
              size="md"
              disabled={items.length === 0}
              onClick={onHoldOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
