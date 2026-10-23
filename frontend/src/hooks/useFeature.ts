import { useAuthStore } from '../stores/auth.store';
import type { FeatureFlags } from '../api/types';

export function useFeature(flagKey: keyof FeatureFlags): boolean {
  const featureFlags = useAuthStore((state) => state.featureFlags);
  if (!featureFlags) return false;
  return Boolean(featureFlags[flagKey]);
}
