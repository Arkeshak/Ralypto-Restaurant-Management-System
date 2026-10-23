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
    expect(getRoleLandingRoute(undefined)).toBe('/tables');
  });

  it('verifies owner permissions', () => {
    const owner = ROLE_PERMISSIONS_MAP.owner;
    expect(owner.canAccessPos).toBe(true);
    expect(owner.canAccessTables).toBe(true);
    expect(owner.canAccessKitchen).toBe(true);
    expect(owner.canAccessWaiter).toBe(true);
    expect(owner.canAccessInventory).toBe(true);
    expect(owner.canAccessAccounting).toBe(true);
    expect(owner.canAccessReports).toBe(true);
    expect(owner.canAccessSettings).toBe(true);
    expect(owner.canAccessAdmin).toBe(false);
    expect(owner.canVoidOrderWithoutPin).toBe(true);
  });

  it('verifies manager permissions', () => {
    const manager = ROLE_PERMISSIONS_MAP.manager;
    expect(manager.canAccessPos).toBe(true);
    expect(manager.canAccessTables).toBe(true);
    expect(manager.canAccessKitchen).toBe(true);
    expect(manager.canAccessWaiter).toBe(true);
    expect(manager.canAccessInventory).toBe(true);
    expect(manager.canAccessAccounting).toBe(false); // Only owner/accountant
    expect(manager.canAccessReports).toBe(true);
    expect(manager.canAccessSettings).toBe(true);
    expect(manager.canAccessAdmin).toBe(false);
    expect(manager.canVoidOrderWithoutPin).toBe(true);
  });

  it('verifies cashier permissions', () => {
    const cashier = ROLE_PERMISSIONS_MAP.cashier;
    expect(cashier.canAccessPos).toBe(true);
    expect(cashier.canAccessTables).toBe(true);
    expect(cashier.canAccessKitchen).toBe(false);
    expect(cashier.canAccessWaiter).toBe(false);
    expect(cashier.canAccessInventory).toBe(false);
    expect(cashier.canAccessAccounting).toBe(false);
    expect(cashier.canAccessReports).toBe(false);
    expect(cashier.canAccessSettings).toBe(false);
    expect(cashier.canAccessAdmin).toBe(false);
    expect(cashier.canVoidOrderWithoutPin).toBe(false); // Requires manager PIN
  });

  it('verifies waiter permissions', () => {
    const waiter = ROLE_PERMISSIONS_MAP.waiter;
    expect(waiter.canAccessPos).toBe(false);
    expect(waiter.canAccessTables).toBe(true);
    expect(waiter.canAccessKitchen).toBe(false);
    expect(waiter.canAccessWaiter).toBe(true);
    expect(waiter.canAccessInventory).toBe(false);
    expect(waiter.canAccessAccounting).toBe(false);
    expect(waiter.canAccessReports).toBe(false);
    expect(waiter.canAccessSettings).toBe(false);
    expect(waiter.canAccessAdmin).toBe(false);
    expect(waiter.canVoidOrderWithoutPin).toBe(false);
  });

  it('verifies kitchen chef permissions', () => {
    const kitchen = ROLE_PERMISSIONS_MAP.kitchen;
    expect(kitchen.canAccessPos).toBe(false);
    expect(kitchen.canAccessTables).toBe(false);
    expect(kitchen.canAccessKitchen).toBe(true);
    expect(kitchen.canAccessWaiter).toBe(false);
    expect(kitchen.canAccessInventory).toBe(false);
    expect(kitchen.canAccessAccounting).toBe(false);
    expect(kitchen.canAccessReports).toBe(false);
    expect(kitchen.canAccessSettings).toBe(false);
    expect(kitchen.canAccessAdmin).toBe(false);
  });

  it('verifies accountant permissions', () => {
    const accountant = ROLE_PERMISSIONS_MAP.accountant;
    expect(accountant.canAccessPos).toBe(false);
    expect(accountant.canAccessTables).toBe(false);
    expect(accountant.canAccessKitchen).toBe(false);
    expect(accountant.canAccessWaiter).toBe(false);
    expect(accountant.canAccessInventory).toBe(true);
    expect(accountant.canAccessAccounting).toBe(true);
    expect(accountant.canAccessReports).toBe(true);
    expect(accountant.canAccessSettings).toBe(false);
    expect(accountant.canAccessAdmin).toBe(false);
  });

  it('verifies super admin permissions', () => {
    const admin = ROLE_PERMISSIONS_MAP.super_admin;
    expect(admin.canAccessAdmin).toBe(true);
    expect(admin.canAccessSettings).toBe(true);
    expect(admin.canAccessReports).toBe(true);
    expect(admin.canVoidOrderWithoutPin).toBe(true);
  });
});
