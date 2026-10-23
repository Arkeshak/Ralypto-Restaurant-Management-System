export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'waiter'
  | 'kitchen'
  | 'accountant';

export type PlanCode = 'basic' | 'standard' | 'premium';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  restaurantId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  code: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
}

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  monthlyPriceCents: number;
}

export interface FeatureFlags {
  pos_billing: boolean;
  kitchen_display: boolean;
  qr_menu_view: boolean;
  qr_self_order: boolean;
  waiter_app: boolean;
  inventory_management: boolean;
  delivery_integration: boolean;
  advanced_reports: boolean;
  accounting_ledger: boolean;
  hr_payroll: boolean;
  multi_branch: boolean;
  ai_assistant: boolean;
  ai_stock_prediction: boolean;
  ai_menu_builder: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  restaurant: Restaurant;
  plan: Plan;
  featureFlags: FeatureFlags;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  targetStation: 'kitchen' | 'bar';
}

export interface Modifier {
  id: string;
  name: string;
  priceDeltaCents: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  costCents: number;
  imageUrl?: string | null;
  isVeg: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  modifiers?: Modifier[];
}

export type TableStatus = 'available' | 'occupied' | 'billed' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  number: string;
  areaName: string;
  capacity: number;
  status: TableStatus;
  activeOrderId?: string | null;
  activeOrderTotalCents?: number | null;
}

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'billed'
  | 'completed'
  | 'voided';

export type OrderItemStatus =
  | 'pending'
  | 'fired'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'canceled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  notes?: string | null;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableNumber?: string | null;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order';
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  serviceChargeCents: number;
  totalCents: number;
  clientCreatedUuid?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amountCents: number;
  paymentMethod: 'cash' | 'card' | 'qr_code' | 'online_transfer';
  status: 'completed' | 'refunded';
  tenderedCents?: number | null;
  changeCents?: number | null;
  createdAt: string;
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  ticketNumber: string;
  tableNumber: string;
  station: 'kitchen' | 'bar';
  status: 'new' | 'preparing' | 'ready' | 'collected';
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  firedAt: string;
  elapsedMinutes: number;
}

export interface Shift {
  id: string;
  openedAt: string;
  closedAt?: string | null;
  openingFloatCents: number;
  cashSalesCents?: number;
  cardSalesCents?: number;
  expectedCashCents?: number;
  closingCashCents?: number | null;
  cashDifferenceCents?: number | null;
  status: 'open' | 'closed';
}

export interface StandardError {
  code: string;
  message: string;
  details?: Record<string, any> | null;
}
