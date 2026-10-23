import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type SubscriptionStatus = 'active' | 'grace_period' | 'read_only' | 'expired';

export function isStatusReadOnly(status: SubscriptionStatus): boolean {
  return status === 'read_only' || status === 'expired';
}

export function isStatusGracePeriod(status: SubscriptionStatus): boolean {
  return status === 'grace_period';
}

export function createPreventInReadOnly(isReadOnly: boolean) {
  return <T extends (...args: any[]) => any>(callback: T) => {
    return (...args: Parameters<T>) => {
      if (isReadOnly) {
        toast.error('Action blocked: Your account is in Read-Only mode. Please renew your plan.');
        return;
      }
      return callback(...args);
    };
  };
}

export function useReadOnly() {
  const { plan } = useAuth();

  // Read subscription status from plan object or dev storage override
  const devStatusOverride =
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'
      ? (localStorage.getItem('ralypto_dev_sub_status') as SubscriptionStatus | null)
      : null;

  const currentStatus: SubscriptionStatus = devStatusOverride || (plan as any)?.status || 'active';
  const isReadOnly = isStatusReadOnly(currentStatus);
  const isGracePeriod = isStatusGracePeriod(currentStatus);
  const preventInReadOnly = createPreventInReadOnly(isReadOnly);

  return {
    isReadOnly,
    isGracePeriod,
    status: currentStatus,
    preventInReadOnly,
  };
}
