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
  icon: LucideIcon;
  roles: Role[];
  feature?: string;
};

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Reports', icon: BarChart3, roles: ['owner', 'manager'] },
  { to: '/tables', label: 'Tables', icon: LayoutGrid, roles: ['owner', 'manager', 'cashier', 'waiter'] },
  { to: '/billing', label: 'Billing', icon: ReceiptText, roles: ['owner', 'manager', 'cashier'] },
  { to: '/kitchen', label: 'Kitchen', icon: ChefHat, roles: ['owner', 'manager', 'kitchen'] },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed, roles: ['owner', 'manager'] },
  { to: '/stock', label: 'Stock', icon: Package, roles: ['owner', 'manager'], feature: 'inventory_management' },
  { to: '/delivery', label: 'Delivery', icon: Bike, roles: ['owner', 'manager', 'cashier'], feature: 'delivery_integration' },
  { to: '/accounts', label: 'Accounts', icon: Wallet, roles: ['owner', 'accountant'], feature: 'accounting_ledger' },
  { to: '/staff', label: 'Staff', icon: Users, roles: ['owner', 'manager'] },
  { to: '/ai', label: 'Ask AI', icon: Sparkles, roles: ['owner', 'manager'], feature: 'ai_assistant' },
  { to: '/subscription', label: 'My Plan', icon: CreditCard, roles: ['owner', 'manager'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['owner', 'manager'] },
];
