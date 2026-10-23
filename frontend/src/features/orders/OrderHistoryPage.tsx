import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  Receipt,
  RotateCcw,
  Printer,
  X,
  Clock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { ordersApi } from '@/api/endpoints/orders';
import { MoneyText } from '@/components/common/MoneyText';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { formatMoney } from '@/lib/formatMoney';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Order } from '@/api/types';

export const OrderHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Selected Order for Details Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Reprint Receipt Modal State
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);

  // Refund / Void Dialog State
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrders();
      setOrders(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        o.items.some((i) => i.name.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      let matchDate = true;
      if (dateFilter === 'today') {
        const orderDate = new Date(o.createdAt).toDateString();
        const today = new Date().toDateString();
        matchDate = orderDate === today;
      } else if (dateFilter === 'week') {
        const weekAgo = Date.now() - 7 * 86400000;
        matchDate = new Date(o.createdAt).getTime() >= weekAgo;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Virtualizer Setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund / void');
      return;
    }
    if (managerPin.length < 4) {
      toast.error('Please enter the 4-digit Manager PIN');
      return;
    }

    setIsRefunding(true);
    try {
      const updated = await ordersApi.refundOrder(selectedOrder.id, {
        managerPin,
        reason: refundReason.trim(),
        refundedBy: user?.name || 'Manager',
      });

      // Update state
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(updated);
      setIsRefundOpen(false);
      setRefundReason('');
      setManagerPin('');
      toast.success(`Order ${updated.orderNumber} successfully refunded`);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid Manager PIN or authorization failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Completed
          </span>
        );
      case 'preparing':
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            In Kitchen
          </span>
        );
      case 'billed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Bill Printed
          </span>
        );
      case 'refunded':
      case 'voided':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            {status === 'refunded' ? 'Refunded' : 'Voided'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/20 text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      {/* Left: Main Virtualized Orders List */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header & Controls */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text">Order History & Refunds</h1>
              <p className="text-xs text-muted">Audit past bills, reprint receipts, and process refunds</p>
            </div>
            <div className="text-xs font-semibold text-muted">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search by order #, table, or food item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {['all', 'completed', 'billed', 'preparing', 'refunded', 'voided'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors capitalize ${
                    statusFilter === st
                      ? 'bg-brand text-surface'
                      : 'bg-bg text-muted border border-border hover:text-text'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Date Preset */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-border bg-bg text-xs font-semibold text-text focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </div>

        {/* Content Area: Loading, Error, Empty, or Virtualized List */}
        <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-2xl border border-border p-4 bg-bg/50 animate-pulse space-y-2">
                  <div className="h-4 w-1/4 bg-border/60 rounded" />
                  <div className="h-3 w-1/2 bg-border/40 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-text">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 rounded-xl bg-brand text-surface text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Receipt className="h-10 w-10 text-muted mx-auto opacity-40" />
              <p className="text-sm font-semibold text-text">No orders found</p>
              <p className="text-xs text-muted">Try adjusting your search query or status filter.</p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const order = filteredOrders[virtualRow.index];
                const isSelected = selectedOrder?.id === order.id;
                const formattedDate = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={order.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-2.5"
                  >
                    <div
                      onClick={() => setSelectedOrder(order)}
                      className={`h-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-brand bg-brand/5 shadow-sm'
                          : 'border-border bg-surface hover:border-brand/40 hover:bg-bg/40'
                      }`}
                    >
                      {/* Left Meta */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text">{order.orderNumber}</span>
                          <span className="text-xs font-semibold text-muted">
                            {order.tableNumber ? `· ${order.tableNumber}` : '· Takeaway'}
                          </span>
                          <span className="text-[11px] text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formattedDate}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>

                        {/* Items preview */}
                        <div className="text-xs text-muted truncate mt-1">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </div>

                      {/* Right Total */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-text tabular-nums">
                          <MoneyText cents={order.totalCents} />
                        </div>
                        <span className="text-[10px] text-muted capitalize">
                          {order.orderType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer: Selected Order Details */}
      {selectedOrder && (
        <div className="w-96 border-l border-border bg-surface p-5 flex flex-col justify-between overflow-y-auto shrink-0 shadow-lg">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="text-lg font-bold text-text">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Audit & Status Overview */}
            <div className="mt-3 p-3 rounded-2xl bg-bg border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Table:</span>
                <span className="font-semibold text-text">
                  {selectedOrder.tableNumber || 'Direct Takeaway'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Placed At:</span>
                <span className="text-text">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              {(selectedOrder as any).refundReason && (
                <div className="mt-2 pt-2 border-t border-border/60 text-rose-600">
                  <span className="font-bold block">Refund Audit:</span>
                  <span>
                    Refunded by {(selectedOrder as any).refundedBy || 'Manager'}: "
                    {(selectedOrder as any).refundReason}"
                  </span>
                </div>
              )}
            </div>

            {/* Itemized list */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                Items ({selectedOrder.items.length})
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {selectedOrder.items.map((i) => (
                  <div
                    key={i.id}
                    className="p-2.5 rounded-xl border border-border bg-bg/40 flex justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-text">
                        {i.quantity}x {i.name}
                      </span>
                      {i.notes && <p className="text-[11px] text-muted italic">Note: {i.notes}</p>}
                    </div>
                    <span className="font-bold tabular-nums text-text">
                      <MoneyText cents={i.subtotalCents} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="mt-4 p-3.5 rounded-2xl bg-bg border border-border space-y-1 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span className="tabular-nums font-semibold text-text">
                  <MoneyText cents={selectedOrder.subtotalCents} />
                </span>
              </div>
              {selectedOrder.discountCents > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="tabular-nums font-semibold">
                    -<MoneyText cents={selectedOrder.discountCents} />
                  </span>
                </div>
              )}
              {selectedOrder.serviceChargeCents > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Service Charge:</span>
                  <span className="tabular-nums font-semibold text-text">
                    +<MoneyText cents={selectedOrder.serviceChargeCents} />
                  </span>
                </div>
              )}
              {selectedOrder.taxCents > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Govt Tax:</span>
                  <span className="tabular-nums font-semibold text-text">
                    +<MoneyText cents={selectedOrder.taxCents} />
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-extrabold text-text">
                <span>Total:</span>
                <span className="tabular-nums">
                  <MoneyText cents={selectedOrder.totalCents} />
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 space-y-2 border-t border-border/60 shrink-0">
            <button
              onClick={() => setReprintOrder(selectedOrder)}
              className="w-full h-11 rounded-2xl border border-border bg-surface hover:bg-bg text-text text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Reprint 80mm Receipt</span>
            </button>

            {selectedOrder.status !== 'voided' && (
              <button
                onClick={() => setIsRefundOpen(true)}
                className="w-full h-11 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Refund / Void Order</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {reprintOrder && (
        <ReceiptModal
          isOpen={Boolean(reprintOrder)}
          orderNumber={reprintOrder.orderNumber}
          tableNumber={reprintOrder.tableNumber || undefined}
          items={reprintOrder.items.map((i) => ({
            id: i.id,
            name: i.name,
            qty: i.quantity,
            priceCents: i.unitPriceCents,
          }))}
          totals={{
            subtotal: reprintOrder.subtotalCents,
            discount: reprintOrder.discountCents,
            service: reprintOrder.serviceChargeCents,
            tax: reprintOrder.taxCents,
            total: reprintOrder.totalCents,
          }}
          onClose={() => setReprintOrder(null)}
          onPrint={() => toast.success('Reprinted 80mm bill')}
        />
      )}

      {/* Refund / Void Manager Authorization Dialog */}
      {isRefundOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 shadow-2xl text-text space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-bold text-text">Manager Refund Authorization</h3>
              </div>
              <button onClick={() => setIsRefundOpen(false)} className="text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Refunding order <b className="text-text">{selectedOrder.orderNumber}</b> for{' '}
              <b className="text-text">{formatMoney(selectedOrder.totalCents)}</b> requires manager approval.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Reason for Refund / Cancellation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer change of mind, food remake, error..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Enter 4-Digit Manager PIN (1111 or 2222)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="w-full h-11 px-3 text-center tracking-widest text-lg font-bold rounded-xl border border-border bg-bg text-text focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundOpen(false)}
                  className="h-11 rounded-xl border border-border bg-surface text-text text-xs font-semibold hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-surface text-xs font-bold transition-all active:scale-95"
                >
                  {isRefunding ? 'Processing...' : 'Authorize Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderHistoryPage;
