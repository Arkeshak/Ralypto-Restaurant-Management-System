import { create } from 'zustand';
import type { User, Restaurant, Plan, PlanCode, FeatureFlags } from '../api/types';

interface AuthState {
  token: string | null;
  user: User | null;
  restaurant: Restaurant | null;
  plan: Plan | null;
  featureFlags: FeatureFlags | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: {
    token: string;
    user: User;
    restaurant: Restaurant;
    plan: Plan;
    featureFlags: FeatureFlags;
  }) => void;
  setMockPlan: (planCode: PlanCode) => void;
  logout: () => void;
}

export const PLAN_FEATURE_FLAGS_MAP: Record<PlanCode, FeatureFlags> = {
  basic: {
    pos_billing: true,
    kitchen_display: true,
    qr_menu_view: true,
    qr_self_order: false,
    waiter_app: false,
    inventory_management: false,
    delivery_integration: false,
    advanced_reports: false,
    accounting_ledger: false,
    hr_payroll: false,
    multi_branch: false,
    ai_assistant: false,
    ai_stock_prediction: false,
    ai_menu_builder: false,
  },
  standard: {
    pos_billing: true,
    kitchen_display: true,
    qr_menu_view: true,
    qr_self_order: true,
    waiter_app: true,
    inventory_management: true,
    delivery_integration: true,
    advanced_reports: true,
    accounting_ledger: false,
    hr_payroll: false,
    multi_branch: false,
    ai_assistant: true,
    ai_stock_prediction: true,
    ai_menu_builder: false,
  },
  premium: {
    pos_billing: true,
    kitchen_display: true,
    qr_menu_view: true,
    qr_self_order: true,
    waiter_app: true,
    inventory_management: true,
    delivery_integration: true,
    advanced_reports: true,
    accounting_ledger: true,
    hr_payroll: true,
    multi_branch: true,
    ai_assistant: true,
    ai_stock_prediction: true,
    ai_menu_builder: true,
  },
};

export const DEFAULT_DEMO_USER: User = {
  id: 'usr-owner-01',
  email: 'owner@ralypto.com',
  firstName: 'Arkesh',
  lastName: 'Fernando',
  role: 'owner',
  restaurantId: 'rest-cey-101',
};

export const DEFAULT_DEMO_RESTAURANT: Restaurant = {
  id: 'rest-cey-101',
  name: 'Ceylon Spice Bistro',
  code: 'CEY101',
  currency: 'LKR',
  taxRate: 0.0,
  serviceChargeRate: 0.1,
};

export const DEFAULT_DEMO_PLAN: Plan = {
  id: 'plan-premium',
  code: 'premium',
  name: 'Premium Plan',
  monthlyPriceCents: 4800000,
};

const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const initialToken = (hasLocalStorage && localStorage.getItem('ralypto_token')) || 'mock-jwt-token-usr-owner-01';
const initialUserJson = hasLocalStorage ? localStorage.getItem('ralypto_user') : null;
const initialPlanJson = hasLocalStorage ? localStorage.getItem('ralypto_plan') : null;
const initialRestaurantJson = hasLocalStorage ? localStorage.getItem('ralypto_restaurant') : null;
const initialFlagsJson = hasLocalStorage ? localStorage.getItem('ralypto_flags') : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUserJson ? JSON.parse(initialUserJson) : DEFAULT_DEMO_USER,
  restaurant: initialRestaurantJson ? JSON.parse(initialRestaurantJson) : DEFAULT_DEMO_RESTAURANT,
  plan: initialPlanJson ? JSON.parse(initialPlanJson) : DEFAULT_DEMO_PLAN,
  featureFlags: initialFlagsJson ? JSON.parse(initialFlagsJson) : PLAN_FEATURE_FLAGS_MAP.premium,
  isAuthenticated: true,
  isLoading: false,

  setAuth: ({ token, user, restaurant, plan, featureFlags }) => {
    if (hasLocalStorage) {
      localStorage.setItem('ralypto_token', token);
      localStorage.setItem('ralypto_user', JSON.stringify(user));
      localStorage.setItem('ralypto_restaurant', JSON.stringify(restaurant));
      localStorage.setItem('ralypto_plan', JSON.stringify(plan));
      localStorage.setItem('ralypto_flags', JSON.stringify(featureFlags));
    }

    set({
      token,
      user,
      restaurant,
      plan,
      featureFlags,
      isAuthenticated: true,
    });
  },

  setMockPlan: (planCode: PlanCode) => {
    const flags = PLAN_FEATURE_FLAGS_MAP[planCode];
    const updatedPlan: Plan = {
      id: `plan-${planCode}`,
      code: planCode,
      name: `${planCode.charAt(0).toUpperCase() + planCode.slice(1)} Plan`,
      monthlyPriceCents:
        planCode === 'basic' ? 1250000 : planCode === 'standard' ? 2450000 : 4800000,
    };

    if (hasLocalStorage) {
      localStorage.setItem('ralypto_plan', JSON.stringify(updatedPlan));
      localStorage.setItem('ralypto_flags', JSON.stringify(flags));
    }

    set({
      plan: updatedPlan,
      featureFlags: flags,
    });
  },

  logout: () => {
    if (hasLocalStorage) {
      localStorage.removeItem('ralypto_token');
      localStorage.removeItem('ralypto_user');
      localStorage.removeItem('ralypto_restaurant');
      localStorage.removeItem('ralypto_plan');
      localStorage.removeItem('ralypto_flags');
    }

    // In demo mode, reset to default demo owner so visitor never gets trapped on login
    set({
      token: 'mock-jwt-token-usr-owner-01',
      user: DEFAULT_DEMO_USER,
      restaurant: DEFAULT_DEMO_RESTAURANT,
      plan: DEFAULT_DEMO_PLAN,
      featureFlags: PLAN_FEATURE_FLAGS_MAP.premium,
      isAuthenticated: true,
    });
  },
}));
