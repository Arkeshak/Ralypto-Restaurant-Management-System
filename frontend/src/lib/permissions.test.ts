import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS_MAP, getRoleLandingRoute } from './permissions';

describe('Role Permissions & Landing Routes', () => {
  it('assigns correct landing screen per staff role according to UX specs', () => {
    expect(getRoleLandingRoute('owner')).toBe('/dashboard');
    expect(getRoleLandingRoute('manager')).toBe('/dashboard');
    expect(getRoleLandingRoute('cashier')).toBe('/billing');
    expect(getRoleLandingRoute('waiter')).toBe('/tables');
    expect(getRoleLandingRoute('kitchen')).toBe('/kitchen');
    expect(getRoleLandingRoute('accountant')).toBe('/accounts');
    expect(getRoleLandingRoute('super_admin')).toBe('/admin');
  });

  it('restricts POS billing and manager functions appropriately', () => {
    // Owner and manager can void without PIN and access pos
    expect(ROLE_PERMISSIONS_MAP.owner.canVoidOrderWithoutPin).toBe(true);
    expect(ROLE_PERMISSIONS_MAP.manager.canVoidOrderWithoutPin).toBe(true);
    expect(ROLE_PERMISSIONS_MAP.cashier.canVoidOrderWithoutPin).toBe(false);
    expect(ROLE_PERMISSIONS_MAP.waiter.canVoidOrderWithoutPin).toBe(false);

    // Kitchen cannot access POS or tables
    expect(ROLE_PERMISSIONS_MAP.kitchen.canAccessPos).toBe(false);
    expect(ROLE_PERMISSIONS_MAP.kitchen.canAccessTables).toBe(false);
    expect(ROLE_PERMISSIONS_MAP.kitchen.canAccessKitchen).toBe(true);

    // Accountant has accounting ledger and reports access
    expect(ROLE_PERMISSIONS_MAP.accountant.canAccessAccounting).toBe(true);
    expect(ROLE_PERMISSIONS_MAP.accountant.canAccessReports).toBe(true);
    expect(ROLE_PERMISSIONS_MAP.accountant.canAccessPos).toBe(false);
  });
});
