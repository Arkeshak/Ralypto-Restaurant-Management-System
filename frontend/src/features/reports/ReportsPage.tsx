import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/endpoints/reports';
import { MoneyText } from '../../components/common/MoneyText';
import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign, Download } from 'lucide-react';
import { BigButton } from '../../components/common/BigButton';

export const ReportsPage: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: reportsApi.getDashboard,
  });

  const { data: sales } = useQuery({
    queryKey: ['reports-sales'],
    queryFn: () => reportsApi.getSalesReport(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Executive Reports & Analytics</h1>
            <p className="text-xs text-zinc-400">Real-time floor KPIs, sales analysis, and exportable z-reports</p>
          </div>
        </div>

        <BigButton variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
          Export Monthly CSV
        </BigButton>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500">Loading KPI metrics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Today's Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <MoneyText cents={dashboard?.todaySalesCents} className="text-2xl text-emerald-400" />
            <span className="mt-2 text-[11px] text-zinc-500 font-medium">+14.2% from yesterday</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Orders Completed</span>
              <ShoppingBag className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {dashboard?.ordersCount || 76}
            </span>
            <span className="mt-2 text-[11px] text-zinc-500 font-medium">Average 8 orders / hr</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Active Tables</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-bold font-mono text-white">
              {dashboard?.activeTables || 5} Tables
            </span>
            <span className="mt-2 text-[11px] text-zinc-500 font-medium">82% floor occupancy</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Average Bill Value</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <MoneyText cents={dashboard?.averageTicketCents} className="text-2xl text-amber-400" />
            <span className="mt-2 text-[11px] text-zinc-500 font-medium">High margin group dining</span>
          </div>
        </div>
      )}

      {/* Payment Method Breakdown */}
      {sales && (
        <div className="p-6 rounded-2xl glass-panel border border-zinc-800">
          <h3 className="text-base font-bold text-white mb-4">Payment Method Distribution (Last 30 Days)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Cash Settlements</p>
                <MoneyText cents={sales.paymentBreakdown.cashCents} className="text-lg text-emerald-400 mt-1" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                46.6%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Credit / Debit Card</p>
                <MoneyText cents={sales.paymentBreakdown.cardCents} className="text-lg text-sky-400 mt-1" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-950 text-sky-400 border border-sky-800">
                53.4%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
