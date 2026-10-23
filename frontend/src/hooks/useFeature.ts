import { useAuthStore } from '../stores/auth.store';
import type { FeatureFlags } from '../api/types';

export function useFeature(): (flagKey?: string) => boolean;
export function useFeature(flagKey: keyof FeatureFlags | string): boolean;
export function useFeature(flagKey?: keyof FeatureFlags | string): boolean | ((key?: string) => boolean) {
  const featureFlags = useAuthStore((state) => state.featureFlags);

  const check = (key?: string): boolean => {
    if (!key) return true;
    if (!featureFlags) return false;
    const flagMap: Record<string, keyof FeatureFlags> = {
      inventory: 'inventory_management',
      delivery: 'delivery_integration',
      accounting: 'accounting_ledger',
      waiter: 'waiter_app',
      ai: 'ai_assistant',
    };
    const mapped = flagMap[key] || (key as keyof FeatureFlags);
    return Boolean(featureFlags[mapped]);
  };

  if (typeof flagKey === 'string') {
    return check(flagKey);
  }

  return check;
}
