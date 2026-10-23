import { describe, it, expect } from 'vitest';
import type { FeatureFlags, PlanCode } from '@/api/types';
import { PLAN_FEATURE_FLAGS_MAP } from '@/stores/auth.store';

export function isRoleAllowed(role: string, allowedRoles: string[]): boolean {
  if (role === 'super_admin') return true;
  return allowedRoles.includes(role);
}

export function isFeatureGranted(planCode: PlanCode, featureKey: keyof FeatureFlags): boolean {
  const flags = PLAN_FEATURE_FLAGS_MAP[planCode];
  return !!flags[featureKey];
}

describe('Role and Plan Guards Logic', () => {
  it('allows access when user role matches allowed roles list', () => {
    expect(isRoleAllowed('owner', ['owner', 'manager'])).toBe(true);
    expect(isRoleAllowed('manager', ['owner', 'manager'])).toBe(true);
  });

  it('blocks access when user role is not in allowed roles', () => {
    expect(isRoleAllowed('waiter', ['owner', 'manager'])).toBe(false);
    expect(isRoleAllowed('kitchen', ['owner', 'manager', 'cashier'])).toBe(false);
    expect(isRoleAllowed('cashier', ['waiter'])).toBe(false);
  });

  it('always permits super_admin to access all routes', () => {
    expect(isRoleAllowed('super_admin', ['cashier'])).toBe(true);
    expect(isRoleAllowed('super_admin', ['kitchen'])).toBe(true);
    expect(isRoleAllowed('super_admin', ['owner'])).toBe(true);
  });

  it('locks inventory and accounting on the Basic plan', () => {
    expect(isFeatureGranted('basic', 'inventory_management')).toBe(false);
    expect(isFeatureGranted('basic', 'accounting_ledger')).toBe(false);
    expect(isFeatureGranted('basic', 'delivery_integration')).toBe(false);
    expect(isFeatureGranted('basic', 'ai_assistant')).toBe(false);

    // Basic still has core POS and Kitchen
    expect(isFeatureGranted('basic', 'pos_billing')).toBe(true);
    expect(isFeatureGranted('basic', 'kitchen_display')).toBe(true);
  });

  it('unlocks inventory, waiter app, and delivery on Standard plan', () => {
    expect(isFeatureGranted('standard', 'inventory_management')).toBe(true);
    expect(isFeatureGranted('standard', 'waiter_app')).toBe(true);
    expect(isFeatureGranted('standard', 'delivery_integration')).toBe(true);
    expect(isFeatureGranted('standard', 'qr_self_order')).toBe(true);

    // Standard still locks Accounting & AI
    expect(isFeatureGranted('standard', 'accounting_ledger')).toBe(false);
    expect(isFeatureGranted('standard', 'ai_assistant')).toBe(false);
  });

  it('unlocks complete feature set on Premium plan', () => {
    expect(isFeatureGranted('premium', 'accounting_ledger')).toBe(true);
    expect(isFeatureGranted('premium', 'hr_payroll')).toBe(true);
    expect(isFeatureGranted('premium', 'ai_assistant')).toBe(true);
    expect(isFeatureGranted('premium', 'ai_stock_prediction')).toBe(true);
    expect(isFeatureGranted('premium', 'multi_branch')).toBe(true);
  });
});
