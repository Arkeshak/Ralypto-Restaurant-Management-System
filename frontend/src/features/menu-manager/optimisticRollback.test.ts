import { describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Optimistic Updates with Rollback', () => {
  it('instantly applies state change and rolls back with toast when API fails', async () => {
    let item = { id: 'item-1', name: 'Chicken Kottu', isAvailable: true };

    const mockApiCall = vi.fn().mockRejectedValue(new Error('Network timeout'));

    async function toggleWithOptimisticRollback() {
      const previousState = item.isAvailable;
      const nextState = !previousState;

      // 1. Instant optimistic update
      item = { ...item, isAvailable: nextState };
      toast.warning(`${item.name} marked as Sold Out`);

      // 2. Perform API call
      try {
        await mockApiCall(item.id, nextState);
      } catch {
        // 3. Rollback on failure
        item = { ...item, isAvailable: previousState };
        toast.error(`Failed to update ${item.name}. Reverted.`);
      }
    }

    expect(item.isAvailable).toBe(true);

    // Call function
    await toggleWithOptimisticRollback();

    // Verify API was called
    expect(mockApiCall).toHaveBeenCalledWith('item-1', false);

    // Verify rollback returned state to true
    expect(item.isAvailable).toBe(true);

    // Verify error toast was shown to user
    expect(toast.error).toHaveBeenCalledWith('Failed to update Chicken Kottu. Reverted.');
  });
});
