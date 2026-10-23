import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFriendlyErrorMessage, apiClient, ApiError } from './client';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock i18n
vi.mock('@/i18n', () => ({
  default: {
    language: 'en',
  },
}));

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, val: string) => {
    mockStorage[key] = val;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
});

describe('apiClient & error mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('maps known error codes to user-friendly messages', () => {
    expect(getFriendlyErrorMessage('NETWORK_ERROR')).toBe(
      'No internet connection. Operating offline.'
    );
    expect(getFriendlyErrorMessage('UNAUTHORIZED')).toBe(
      'Session expired. Please sign in again.'
    );
    expect(getFriendlyErrorMessage('FORBIDDEN')).toBe(
      'Permission denied for this action.'
    );
    expect(getFriendlyErrorMessage('SERVER_ERROR')).toBe(
      'Server error occurred. Please try again shortly.'
    );
    expect(getFriendlyErrorMessage('VALIDATION_ERROR')).toBe(
      'Please verify the information entered.'
    );
    expect(getFriendlyErrorMessage('TIMEOUT_ERROR')).toBe(
      'Request timed out after 15 seconds.'
    );
    expect(getFriendlyErrorMessage('NON_EXISTENT_CODE', 'Custom error')).toBe(
      'Custom error'
    );
  });

  it('attaches Bearer authorization header if token exists in localStorage', async () => {
    localStorage.setItem('ralypto_token', 'test-access-token-123');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient<{ success: boolean }>('/test-route', {
      skipErrorToast: true,
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-route'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token-123',
        }),
      })
    );
  });

  it('throws ApiError with standard code and status on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        code: 'FORBIDDEN',
        message: 'You do not have permission',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      apiClient('/restricted-route', { skipErrorToast: true })
    ).rejects.toThrow(ApiError);
  });

  it('retries safe GET requests on 500 server error', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ code: 'SERVER_ERROR' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ recovered: true }),
      };
    });
    vi.stubGlobal('fetch', mockFetch);

    const data = await apiClient<{ recovered: boolean }>('/data-route', {
      method: 'GET',
      skipErrorToast: true,
    });

    expect(data.recovered).toBe(true);
    expect(callCount).toBe(2);
  });
});
