import { describe, it, expect, vi } from 'vitest';
import {
  isStatusReadOnly,
  isStatusGracePeriod,
  createPreventInReadOnly,
} from './useReadOnly';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useReadOnly logic', () => {
  it('correctly identifies read-only and expired subscription statuses', () => {
    expect(isStatusReadOnly('read_only')).toBe(true);
    expect(isStatusReadOnly('expired')).toBe(true);
    expect(isStatusReadOnly('active')).toBe(false);
    expect(isStatusReadOnly('grace_period')).toBe(false);
  });

  it('correctly identifies grace period subscription status', () => {
    expect(isStatusGracePeriod('grace_period')).toBe(true);
    expect(isStatusGracePeriod('active')).toBe(false);
    expect(isStatusGracePeriod('read_only')).toBe(false);
    expect(isStatusGracePeriod('expired')).toBe(false);
  });

  it('allows actions when isReadOnly is false', () => {
    const action = vi.fn();
    const prevent = createPreventInReadOnly(false);
    const wrapped = prevent(action);

    wrapped('param1', 123);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('param1', 123);
  });

  it('blocks actions and shows toast error when isReadOnly is true', async () => {
    const { toast } = await import('sonner');
    const action = vi.fn();
    const prevent = createPreventInReadOnly(true);
    const wrapped = prevent(action);

    wrapped('param1');
    expect(action).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Action blocked: Your account is in Read-Only mode. Please renew your plan.'
    );
  });
});
