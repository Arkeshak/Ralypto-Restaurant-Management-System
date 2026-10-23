import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Receipt,
  Smartphone,
  ChefHat,
  QrCode,
  BookOpen,
  Boxes,
  Calculator,
  BarChart3,
  Truck,
  Sparkles,
  CreditCard,
  Settings,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useUiStore } from '../../stores/ui.store';
import type { FeatureFlags } from '../../api/types';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  featureKey?: keyof FeatureFlags;
  allowedRoles?: string[];
}

export const Sidebar: React.FC = () => {
  const { user, featureFlags } = useAuth();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      to: '/pos',
      labelKey: 'nav.pos',
      icon: <LayoutGrid className="w-5 h-5" />,
      featureKey: 'pos_billing',
      allowedRoles: ['owner', 'manager', 'cashier', 'super_admin'],
    },
    {
      to: '/orders',
      labelKey: 'nav.orders',
      icon: <Receipt className="w-5 h-5" />,
      allowedRoles: ['owner', 'manager', 'cashier', 'super_admin'],
    },
    {
      to: '/waiter',
      labelKey: 'nav.waiter',
      icon: <Smartphone className="w-5 h-5" />,
      featureKey: 'waiter_app',
      allowedRoles: ['owner', 'manager', 'waiter', 'super_admin'],
    },
    {
      to: '/kitchen',
      labelKey: 'nav.kitchen',
      icon: <ChefHat className="w-5 h-5" />,
      featureKey: 'kitchen_display',
      allowedRoles: ['owner', 'manager', 'kitchen', 'cashier', 'super_admin'],
    },
    {
      to: '/qr-menu',
      labelKey: 'nav.qrMenu',
      icon: <QrCode className="w-5 h-5" />,
      featureKey: 'qr_menu_view',
      allowedRoles: ['owner', 'manager', 'cashier', 'super_admin'],
    },
    {
      to: '/menu-manager',
      labelKey: 'nav.menuManager',
      icon: <BookOpen className="w-5 h-5" />,
      allowedRoles: ['owner', 'manager', 'super_admin'],
    },
    {
      to: '/inventory',
      labelKey: 'nav.inventory',
      icon: <Boxes className="w-5 h-5" />,
      featureKey: 'inventory_management',
      allowedRoles: ['owner', 'manager', 'accountant', 'super_admin'],
    },
    {
      to: '/accounting',
      labelKey: 'nav.accounting',
      icon: <Calculator className="w-5 h-5" />,
      featureKey: 'accounting_ledger',
      allowedRoles: ['owner', 'accountant', 'super_admin'],
    },
    {
      to: '/reports',
      labelKey: 'nav.reports',
      icon: <BarChart3 className="w-5 h-5" />,
      allowedRoles: ['owner', 'manager', 'accountant', 'super_admin'],
    },
    {
      to: '/delivery',
      labelKey: 'nav.delivery',
      icon: <Truck className="w-5 h-5" />,
      featureKey: 'delivery_integration',
      allowedRoles: ['owner', 'manager', 'cashier', 'super_admin'],
    },
    {
      to: '/ai',
      labelKey: 'nav.aiAssistant',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      featureKey: 'ai_assistant',
      allowedRoles: ['owner', 'manager', 'super_admin'],
    },
    {
      to: '/subscription',
      labelKey: 'nav.subscription',
      icon: <CreditCard className="w-5 h-5" />,
      allowedRoles: ['owner', 'super_admin'],
    },
    {
      to: '/settings',
      labelKey: 'nav.settings',
      icon: <Settings className="w-5 h-5" />,
      allowedRoles: ['owner', 'manager', 'super_admin'],
    },
    {
      to: '/admin',
      labelKey: 'nav.admin',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />,
      allowedRoles: ['super_admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 glass-panel border-r border-zinc-800 transition-transform duration-200 ease-in-out overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const isFeatureLocked =
              item.featureKey && featureFlags && !featureFlags[item.featureKey];

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group touch-target ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40 font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                  } ${isFeatureLocked ? 'opacity-60' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span>{t(item.labelKey)}</span>
                </div>
                {isFeatureLocked && (
                  <span className="p-1 rounded bg-zinc-800 text-amber-400" title="Upgrade Plan to Unlock">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
};
