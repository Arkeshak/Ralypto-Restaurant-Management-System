import {
  ReceiptText,
  LayoutGrid,
  ChefHat,
  UtensilsCrossed,
  Package,
  BarChart3,
  Wallet,
  Users,
  Bike,
  Settings,
  Sparkles,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export type Role = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'accountant';

export type NavItem = {
  to: string;
  label: string;
  labelKey: string;
  icon: LucideIcon;
  roles: Role[];
  feature?: string;
};

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Reports', labelKey: 'navShell.reports', icon: BarChart3, roles: ['owner', 'manager'] },
  { to: '/tables', label: 'Tables', labelKey: 'navShell.tables', icon: LayoutGrid, roles: ['owner', 'manager', 'cashier', 'waiter'] },
  { to: '/billing', label: 'Billing', labelKey: 'navShell.billing', icon: ReceiptText, roles: ['owner', 'manager', 'cashier'] },
  { to: '/kitchen', label: 'Kitchen', labelKey: 'navShell.kitchen', icon: ChefHat, roles: ['owner', 'manager', 'kitchen'] },
  { to: '/menu', label: 'Menu', labelKey: 'navShell.menu', icon: UtensilsCrossed, roles: ['owner', 'manager'] },
  { to: '/stock', label: 'Stock', labelKey: 'navShell.stock', icon: Package, roles: ['owner', 'manager'], feature: 'inventory_management' },
  { to: '/delivery', label: 'Delivery', labelKey: 'navShell.delivery', icon: Bike, roles: ['owner', 'manager', 'cashier'], feature: 'delivery_integration' },
  { to: '/accounts', label: 'Accounts', labelKey: 'navShell.accounts', icon: Wallet, roles: ['owner', 'accountant'], feature: 'accounting_ledger' },
  { to: '/staff', label: 'Staff', labelKey: 'navShell.staff', icon: Users, roles: ['owner', 'manager'] },
  { to: '/ai', label: 'Ask AI', labelKey: 'navShell.askAi', icon: Sparkles, roles: ['owner', 'manager'], feature: 'ai_assistant' },
  { to: '/subscription', label: 'My Plan', labelKey: 'navShell.myPlan', icon: CreditCard, roles: ['owner', 'manager'] },
  { to: '/settings', label: 'Settings', labelKey: 'navShell.settings', icon: Settings, roles: ['owner', 'manager'] },
];
