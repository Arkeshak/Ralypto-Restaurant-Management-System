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
  aliases?: string[];
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

export type OrderSource =
  | 'pos'
  | 'waiter'
  | 'qr'
  | 'voice_waiter'
  | 'voice_qr'
  | 'whatsapp'
  | 'phone';

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableNumber?: string | null;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order';
  source?: OrderSource;
  aiAssisted?: boolean;
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

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReservationSource =
  | 'web'
  | 'whatsapp'
  | 'phone'
  | 'staff'
  | 'voice_agent';

export interface Reservation {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  partySize: number;
  reservationTime: string; // ISO-8601
  durationMinutes: number;
  tableId?: string | null;
  tableNumber?: string | null;
  status: ReservationStatus;
  source: ReservationSource;
  specialRequests?: string | null;
  createdAt: string;
}

export interface CreateReservationDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationTime: string;
  durationMinutes?: number;
  tableId?: string;
  tableNumber?: string;
  source?: ReservationSource;
  specialRequests?: string;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'seated' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  estimatedWaitMinutes: number;
  status: WaitlistStatus;
  notes?: string | null;
  joinedAt: string;
  notifiedAt?: string | null;
}

export interface CreateWaitlistDto {
  customerName: string;
  customerPhone: string;
  partySize: number;
  estimatedWaitMinutes?: number;
  notes?: string;
}

export interface VoiceParsedItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  notes?: string;
  confidence: number; // 0.0 - 1.0
}

export interface VoiceOrderDraft {
  transcript: string;
  language: 'en' | 'si' | 'ta';
  tableNumber?: string;
  items: VoiceParsedItem[];
  unrecognizedPhrases: string[];
  suggestedUpsell?: {
    menuItemId: string;
    name: string;
    priceCents: number;
    reason: string;
  };
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
