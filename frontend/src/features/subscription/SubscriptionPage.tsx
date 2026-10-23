import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/endpoints/subscription';
import { MoneyText } from '../../components/common/MoneyText';
import { BigButton } from '../../components/common/BigButton';
import { CreditCard, Check, FileText } from 'lucide-react';
import type { PlanCode } from '../../api/types';

export const SubscriptionPage: React.FC = () => {
  const { plan, setMockPlan } = useAuth();

  const { data: invoices = [] } = useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: subscriptionApi.getInvoices,
  });

  const tiers: Array<{
    code: PlanCode;
    name: string;
    priceCents: number;
    description: string;
    features: string[];
    isPopular?: boolean;
  }> = [
    {
      code: 'basic',
      name: 'Basic Plan',
      priceCents: 1250000,
      description: 'Essential POS billing & kitchen display for small eateries',
      features: [
        'POS Billing & Shifts',
        'Kitchen Display System (KDS)',
        'View-Only Digital QR Menu',
        'Up to 3 staff users',
        '10 Core Analytical Reports',
      ],
    },
    {
      code: 'standard',
      name: 'Standard Plan',
      priceCents: 2450000,
      description: 'Complete floor automation, waiter app & inventory costing',
      features: [
        'All Basic Features',
        'Waiter Mobile App (PIN login)',
        'Customer QR Self-Ordering & Waiter Call',
        'Inventory, GRN & Recipe Depletion',
        'Delivery Orders (Uber Eats / PickMe)',
        '35+ Analytical Reports',
        'Up to 10 staff users',
        'Basic AI Low-Stock Alerts',
      ],
      isPopular: true,
    },
    {
      code: 'premium',
      name: 'Premium Plan',
      priceCents: 4800000,
      description: 'Enterprise ERP with Accounting, Payroll & Full AI Suite',
      features: [
        'All Standard Features',
        'Double-Entry Accounting & P&L',
        'Staff HR, Attendance & Payroll',
        'Multi-Branch Management',
        'Unlimited staff users',
        'All AI Features (Chat Assistant, Demand Forecasting, Photo Menu Digitizer)',
        '24/7 Priority Support (WhatsApp & Phone)',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-3xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Subscription & Plan Management</h1>
            <p className="text-sm text-zinc-400">
              Manage your monthly SaaS tier, unlock premium modules, and inspect billing invoices
            </p>
          </div>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => {
          const isCurrent = (plan?.code || 'standard') === t.code;

          return (
            <div
              key={t.code}
              className={`relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-300 border ${
                isCurrent
                  ? 'border-brand-500 bg-brand-950/20 ring-2 ring-brand-500/50 shadow-2xl'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
              }`}
            >
              <div>
                {t.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </span>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{t.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                  </div>
                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-full bg-brand-950 text-brand-400 border border-brand-800 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <MoneyText cents={t.priceCents} className="text-3xl text-white" />
                  <span className="text-xs text-zinc-400 font-medium ml-1.5">/ month</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs text-zinc-300">
                  {t.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <BigButton
                variant={isCurrent ? 'outline' : 'brand'}
                size="touch"
                fullWidth
                disabled={isCurrent}
                onClick={() => setMockPlan(t.code)}
              >
                {isCurrent ? 'Current Plan' : `Switch to ${t.name}`}
              </BigButton>
            </div>
          );
        })}
      </div>

      {/* Invoices History */}
      <div className="p-6 rounded-2xl glass-panel border border-zinc-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span>Billing Invoices</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-zinc-200">
                  <td className="py-3 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="py-3 text-zinc-400">{inv.dueDate}</td>
                  <td className="py-3">
                    <MoneyText cents={inv.amountCents} className="text-xs" />
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-brand-400 hover:text-brand-300 font-semibold">
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
