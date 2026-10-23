import { useAuthStore } from '../stores/auth.store';
import { ROLE_PERMISSIONS_MAP } from '../lib/permissions';

export function useAuth() {
  const store = useAuthStore();
  const permissions = store.user?.role
    ? ROLE_PERMISSIONS_MAP[store.user.role]
    : null;

  const defaultUser = {
    id: 'u-default',
    email: 'admin@ralypto.com',
    firstName: 'Arkesh',
    lastName: 'K',
    name: 'Arkesh K',
    role: 'owner' as const,
    restaurantId: 'rest-1',
  };

  const activeUser = store.user
    ? {
        ...store.user,
        name:
          `${store.user.firstName || ''} ${store.user.lastName || ''}`.trim() ||
          store.user.email ||
          'Staff',
      }
    : defaultUser;

  const activeRestaurant = store.restaurant || {
    id: 'rest-1',
    name: 'Ralypto Flagship',
    code: 'RAL-COLOMBO',
    currency: 'LKR',
    taxRate: 10,
    serviceChargeRate: 10,
  };

  return {
    ...store,
    permissions,
    role: activeUser.role,
    user: activeUser,
    restaurant: activeRestaurant,
    plan: store.plan || {
      id: 'plan-standard',
      code: 'standard' as const,
      name: 'Standard Plan',
      monthlyPriceCents: 2450000,
    },
  };
}
