import { useAuthStore } from '../stores/auth.store';
import { ROLE_PERMISSIONS_MAP } from '../lib/permissions';

export function useAuth() {
  const store = useAuthStore();
  const permissions = store.user?.role
    ? ROLE_PERMISSIONS_MAP[store.user.role]
    : null;

  return {
    ...store,
    permissions,
    role: store.user?.role,
    user: store.user,
    restaurant: store.restaurant,
    plan: store.plan,
  };
}
