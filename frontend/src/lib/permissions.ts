export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'waiter'
  | 'kitchen'
  | 'accountant';

export interface RolePermissions {
  canAccessPos: boolean;
  canAccessTables: boolean;
  canAccessKitchen: boolean;
  canAccessWaiter: boolean;
  canAccessInventory: boolean;
  canAccessAccounting: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
  canAccessAdmin: boolean;
  canVoidOrderWithoutPin: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  super_admin: {
    canAccessPos: true,
    canAccessTables: true,
    canAccessKitchen: true,
    canAccessWaiter: true,
    canAccessInventory: true,
    canAccessAccounting: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdmin: true,
    canVoidOrderWithoutPin: true,
  },
  owner: {
    canAccessPos: true,
    canAccessTables: true,
    canAccessKitchen: true,
    canAccessWaiter: true,
    canAccessInventory: true,
    canAccessAccounting: true,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: true,
  },
  manager: {
    canAccessPos: true,
    canAccessTables: true,
    canAccessKitchen: true,
    canAccessWaiter: true,
    canAccessInventory: true,
    canAccessAccounting: false,
    canAccessReports: true,
    canAccessSettings: true,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: true,
  },
  cashier: {
    canAccessPos: true,
    canAccessTables: true,
    canAccessKitchen: false,
    canAccessWaiter: false,
    canAccessInventory: false,
    canAccessAccounting: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: false,
  },
  waiter: {
    canAccessPos: false,
    canAccessTables: true,
    canAccessKitchen: false,
    canAccessWaiter: true,
    canAccessInventory: false,
    canAccessAccounting: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: false,
  },
  kitchen: {
    canAccessPos: false,
    canAccessTables: false,
    canAccessKitchen: true,
    canAccessWaiter: false,
    canAccessInventory: false,
    canAccessAccounting: false,
    canAccessReports: false,
    canAccessSettings: false,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: false,
  },
  accountant: {
    canAccessPos: false,
    canAccessTables: false,
    canAccessKitchen: false,
    canAccessWaiter: false,
    canAccessInventory: true,
    canAccessAccounting: true,
    canAccessReports: true,
    canAccessSettings: false,
    canAccessAdmin: false,
    canVoidOrderWithoutPin: false,
  },
};

export function getRoleLandingRoute(role?: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'owner':
    case 'manager':
      return '/dashboard';
    case 'cashier':
      return '/pos';
    case 'waiter':
      return '/waiter';
    case 'kitchen':
      return '/kitchen';
    case 'accountant':
      return '/accounting';
    default:
      return '/pos';
  }
}
