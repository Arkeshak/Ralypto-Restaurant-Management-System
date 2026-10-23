import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Trash2, Clock, ShoppingBag } from 'lucide-react';
import { MoneyText } from '@/components/common/MoneyText';
import type { CartItem } from './OrderCartPanel';
import type { Totals } from './cartMath';

export interface HeldOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string | number;
  items: CartItem[];
  totals: Totals;
  heldAt: string;
  notes?: string;
}

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecall: (order: HeldOrder) => void;
  onDelete: (id: string) => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  isOpen,
  onClose,
  heldOrders,
  onRecall,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl bg-surface border border-border shadow-2xl p-6 text-text flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-brand text-surface flex items-center justify-center">
                <Pause className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Held / Parked Orders</h2>
                <p className="text-xs text-muted">
                  {heldOrders.length} {heldOrders.length === 1 ? 'order' : 'orders'} on hold
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {heldOrders.length === 0 ? (
              <div className="py-12 text-center text-muted flex flex-col items-center">
                <ShoppingBag className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-sm font-semibold text-text">No orders currently on hold</p>
                <p className="text-xs mt-1">Tap 'Hold' on an active order to park it temporarily.</p>
              </div>
            ) : (
              heldOrders.map((order) => {
                const elapsedMin = Math.max(
                  1,
                  Math.round((Date.now() - new Date(order.heldAt).getTime()) / 60000)
                );
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border bg-bg/50 hover:border-brand/50 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text">
                            {order.tableNumber ? `Table ${order.tableNumber}` : 'Quick Takeaway'}
                          </span>
                          <span className="text-[11px] font-mono text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                            {order.orderNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Parked {elapsedMin} min ago</span>
                          <span>•</span>
                          <span>{order.items.reduce((s, i) => s + i.qty, 0)} items</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-brand tabular-nums">
                          <MoneyText cents={order.totals.total} />
                        </span>
                      </div>
                    </div>

                    {/* Preview items */}
                    <div className="text-xs text-muted truncate border-t border-border/40 pt-2">
                      {order.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onDelete(order.id)}
                        className="h-10 px-3 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-600 text-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Discard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRecall(order);
                          onClose();
                        }}
                        className="flex-1 h-10 rounded-xl bg-brand text-surface hover:opacity-95 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Recall & Resume Order</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
