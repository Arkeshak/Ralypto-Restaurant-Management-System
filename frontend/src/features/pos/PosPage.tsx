import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '../../api/endpoints/tables';
import { ordersApi } from '../../api/endpoints/orders';
import { shiftsApi } from '../../api/endpoints/shifts';
import { StatusPill } from '../../components/common/StatusPill';
import { MoneyText } from '../../components/common/MoneyText';
import { BigButton } from '../../components/common/BigButton';
import { useUiStore } from '../../stores/ui.store';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Clock,
  Printer,
  CreditCard,
  Send,
  XCircle,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import type { Table, TableStatus } from '../../api/types';

export const PosPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { openManagerPinModal } = useUiStore();
  const { t } = useTranslation();

  // Queries
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getTables,
  });

  const { data: currentShift } = useQuery({
    queryKey: ['shift-current'],
    queryFn: shiftsApi.getCurrentShift,
  });

  const { data: activeOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['order', selectedTable?.activeOrderId],
    queryFn: () => (selectedTable?.activeOrderId ? ordersApi.getOrder(selectedTable.activeOrderId) : null),
    enabled: !!selectedTable?.activeOrderId,
  });

  // Mutations
  const updateTableMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      tablesApi.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setSelectedTable(updated);
    },
  });

  const handleSendToKitchen = async () => {
    if (!selectedTable?.activeOrderId) return;
    try {
      await ordersApi.sendToKitchen(selectedTable.activeOrderId);
      refetchOrder();
      setActionSuccess('Order items successfully sent to Kitchen display!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to dispatch to kitchen');
    }
  };

  const handleRequestBill = async () => {
    if (!selectedTable?.activeOrderId) return;
    try {
      await ordersApi.requestBill(selectedTable.activeOrderId);
      updateTableMutation.mutate({ id: selectedTable.id, status: 'billed' });
      setActionSuccess('Bill printed & table marked as Billed');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to print bill');
    }
  };

  const handleSettlePayment = async () => {
    if (!selectedTable?.activeOrderId) return;
    try {
      await ordersApi.pay(selectedTable.activeOrderId, {
        amountCents: activeOrder?.totalCents || 379500,
        paymentMethod: 'cash',
      });
      updateTableMutation.mutate({ id: selectedTable.id, status: 'available' });
      setSelectedTable(null);
      setActionSuccess('Payment settled in full! Table is now available.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (e: any) {
      alert(e.message || 'Failed to settle payment');
    }
  };

  const handleVoidOrder = () => {
    if (!selectedTable?.activeOrderId) return;
    openManagerPinModal(
      'Void Active Order',
      `Authorization required to void order for ${selectedTable.number}. Enter your 4-digit Manager PIN.`,
      async (pin) => {
        try {
          await ordersApi.voidOrder(selectedTable.activeOrderId!, {
            managerPin: pin,
            reason: 'Customer cancelled floor order',
          });
          updateTableMutation.mutate({ id: selectedTable.id, status: 'available' });
          setSelectedTable(null);
          setActionSuccess('Order voided successfully by Manager PIN.');
          setTimeout(() => setActionSuccess(null), 3500);
        } catch (e: any) {
          alert(e.message || 'Manager PIN rejected');
        }
      }
    );
  };

  const filteredTables = tables.filter((t) => {
    if (filter === 'all') return true;
    return t.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Shift Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{t('pos.title')}</span>
            <span className="text-xs font-normal text-zinc-400">| Dine-In Floor Management</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Shift Register: Active • Opening Float:{' '}
            <MoneyText cents={currentShift?.openingFloatCents || 1000000} className="text-xs" />
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs overflow-x-auto">
          {['all', 'available', 'occupied', 'billed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {f === 'all' ? t('common.all') : t(`common.${f === 'available' ? 'free' : f}`)}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Left is Table Map, Right is Active Order Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Map Grid */}
        <div className="lg:col-span-2 space-y-4">
          {tablesLoading ? (
            <div className="p-12 text-center text-zinc-500 font-medium">Loading floor tables...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left touch-target ${
                      isSelected
                        ? 'border-brand-500 bg-brand-950/20 ring-2 ring-brand-500/50 shadow-xl'
                        : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xl font-bold tracking-tight text-white">
                        {table.number}
                      </span>
                      <StatusPill status={table.status} />
                    </div>

                    <p className="text-xs text-zinc-400 mb-3">{table.areaName}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
                      <span className="flex items-center gap-1 text-zinc-400 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {table.capacity} Seats
                      </span>
                      {table.activeOrderTotalCents ? (
                        <MoneyText cents={table.activeOrderTotalCents} className="text-sm text-brand-400" />
                      ) : (
                        <span className="text-emerald-400 font-semibold text-[11px]">Free</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Table Order Detail Panel */}
        <div className="rounded-2xl glass-panel border border-zinc-800 p-5 flex flex-col justify-between min-h-[460px]">
          {selectedTable ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedTable.number}</h3>
                    <p className="text-xs text-zinc-400">{selectedTable.areaName}</p>
                  </div>
                  <StatusPill status={selectedTable.status} />
                </div>

                {activeOrder ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Order #{activeOrder.orderNumber}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> 15m ago
                      </span>
                    </div>

                    {/* Ordered Items List */}
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                      {activeOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs"
                        >
                          <div>
                            <p className="font-bold text-zinc-200">
                              {item.quantity}x {item.name}
                            </p>
                            {item.notes && <p className="text-[11px] text-zinc-400 italic">{item.notes}</p>}
                          </div>
                          <MoneyText cents={item.subtotalCents} className="text-xs" />
                        </div>
                      ))}
                    </div>

                    {/* Bill Totals Calculation */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>{t('common.subtotal')}</span>
                        <MoneyText cents={activeOrder.subtotalCents} showCurrency={false} />
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>{t('common.serviceCharge')}</span>
                        <MoneyText cents={activeOrder.serviceChargeCents} showCurrency={false} />
                      </div>
                      <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                        <span>{t('common.total')}</span>
                        <MoneyText cents={activeOrder.totalCents} className="text-lg text-brand-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-400 text-sm">
                    <Coffee className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-300">Table is currently empty</p>
                    <p className="text-xs text-zinc-500 mt-1">Tap below to seat guests & open ticket</p>
                    <div className="mt-4">
                      <BigButton
                        variant="secondary"
                        size="sm"
                        onClick={() => updateTableMutation.mutate({ id: selectedTable.id, status: 'occupied' })}
                      >
                        Seat Guests
                      </BigButton>
                    </div>
                  </div>
                )}
              </div>

              {/* POS Action Buttons */}
              {activeOrder && (
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <BigButton
                      variant="brand"
                      size="touch"
                      onClick={handleSendToKitchen}
                      icon={<Send className="w-4 h-4" />}
                    >
                      {t('pos.sendToKitchen')}
                    </BigButton>

                    <BigButton
                      variant="secondary"
                      size="touch"
                      onClick={handleRequestBill}
                      icon={<Printer className="w-4 h-4" />}
                    >
                      {t('pos.requestBill')}
                    </BigButton>
                  </div>

                  <BigButton
                    variant="success"
                    size="touch-lg"
                    fullWidth
                    onClick={handleSettlePayment}
                    icon={<CreditCard className="w-5 h-5" />}
                  >
                    {t('pos.settlePayment')} (LKR)
                  </BigButton>

                  <button
                    onClick={handleVoidOrder}
                    className="w-full text-center text-xs font-semibold text-red-400 hover:text-red-300 py-1 transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t('pos.voidOrder')} (Requires Manager PIN)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-500">
              <Users className="w-12 h-12 mb-3 text-zinc-700" />
              <h4 className="text-base font-bold text-zinc-300 mb-1">{t('pos.noActiveOrder')}</h4>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Tap any table on the floor map to review active orders, dispatch to kitchen, or print receipt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
