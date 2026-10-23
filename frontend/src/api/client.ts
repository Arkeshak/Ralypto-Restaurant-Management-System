import type { StandardError } from './types';
import { toast } from 'sonner';
import i18n from '@/i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: Record<string, any> | null;
  status: number;

  constructor(status: number, error: StandardError) {
    super(error.message || 'API request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error.details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipErrorToast?: boolean;
  retries?: number;
}

const FRIENDLY_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  NETWORK_ERROR: {
    en: 'No internet connection. Operating offline.',
    si: 'අන්තර්ජාල සම්බන්ධතාවයක් නොමැත. නොබැඳිව ක්‍රියා කරයි.',
    ta: 'இணைய இணைப்பு இல்லை. ஆஃப்லைனில் செயல்படுகிறது.',
  },
  UNAUTHORIZED: {
    en: 'Session expired. Please sign in again.',
    si: 'සැසිය කල් ඉකුත් විය. කරුණාකර නැවත පිවිසෙන්න.',
    ta: 'அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.',
  },
  FORBIDDEN: {
    en: 'Permission denied for this action.',
    si: 'මෙම ක්‍රියාව සඳහා අවසර නොමැත.',
    ta: 'இந்த செயலுக்கு அனுமதி இல்லை.',
  },
  SERVER_ERROR: {
    en: 'Server error occurred. Please try again shortly.',
    si: 'සේවාදායකයේ දෝෂයක් ඇති විය. කරුණාකර සුළු වේලාවකින් නැවත උත්සාහ කරන්න.',
    ta: 'சேவையக பிழை ஏற்பட்டது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.',
  },
  VALIDATION_ERROR: {
    en: 'Please verify the information entered.',
    si: 'කරුණාකර ඇතුළත් කළ තොරතුරු පරීක්ෂා කරන්න.',
    ta: 'உள்ளிடப்பட்ட தகவலைச் சரிபார்க்கவும்.',
  },
  TIMEOUT_ERROR: {
    en: 'Request timed out after 15 seconds.',
    si: 'තත්පර 15කට පසු ඉල්ලීම කල් ඉකුත් විය.',
    ta: '15 வினாடிகளுக்குப் பிறகு கோரிக்கை காலாவதியானது.',
  },
};

export function getFriendlyErrorMessage(code: string, fallbackMessage?: string): string {
  const lang = (i18n.language ? i18n.language.slice(0, 2) : 'en') as 'en' | 'si' | 'ta';
  const entry = FRIENDLY_ERROR_MESSAGES[code];
  if (entry) {
    return entry[lang] || entry.en;
  }
  return fallbackMessage || 'An unexpected error occurred';
}

// 401 Single-flight token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function handleCleanLogout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ralypto_token');
    localStorage.removeItem('ralypto_refresh_token');
    localStorage.removeItem('ralypto_user');
    localStorage.removeItem('ralypto_restaurant');
    localStorage.removeItem('ralypto_plan');
    localStorage.removeItem('ralypto_flags');

    // Only redirect if not already on login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/pin-login')) {
      window.location.href = '/login';
    }
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, skipErrorToast = false, retries = 0, ...customConfig } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('ralypto_token')
      : null;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const method = (customConfig.method || 'GET').toUpperCase();
  const isSafeGet = method === 'GET';

  // 15-second AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...customConfig,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized with token refresh (skip if already calling auth endpoints)
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('ralypto_refresh_token')
          : null;

      if (!refreshToken) {
        handleCleanLogout();
        const err = new ApiError(401, {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please sign in again.',
        });
        if (!skipErrorToast) {
          toast.error(getFriendlyErrorMessage('UNAUTHORIZED'));
        }
        throw err;
      }

      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              apiClient<T>(endpoint, {
                ...options,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
                .then(resolve)
                .catch(reject);
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh failed');
        }

        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.accessToken || refreshData.token;

        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          localStorage.setItem('ralypto_token', newAccessToken);
          if (refreshData.refreshToken) {
            localStorage.setItem('ralypto_refresh_token', refreshData.refreshToken);
          }
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request with new access token
        return apiClient<T>(endpoint, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        handleCleanLogout();
        const err = new ApiError(401, {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please sign in again.',
        });
        if (!skipErrorToast) {
          toast.error(getFriendlyErrorMessage('UNAUTHORIZED'));
        }
        throw err;
      }
    }

    if (!response.ok) {
      // Retry safe GET requests if 5xx server error (up to 2 retries)
      if (isSafeGet && response.status >= 500 && retries < 2) {
        await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
        return apiClient<T>(endpoint, { ...options, retries: retries + 1 });
      }

      let errorData: StandardError = {
        code:
          response.status === 403
            ? 'FORBIDDEN'
            : response.status === 422
            ? 'VALIDATION_ERROR'
            : response.status >= 500
            ? 'SERVER_ERROR'
            : 'HTTP_ERROR',
        message: `Request failed with status ${response.status}`,
      };

      try {
        const parsed = await response.json();
        if (parsed.message || parsed.code) {
          errorData = parsed;
        }
      } catch {
        // Fallback to inferred errorData
      }

      const apiErr = new ApiError(response.status, errorData);
      if (!skipErrorToast) {
        const friendly = getFriendlyErrorMessage(apiErr.code, apiErr.message);
        toast.error(friendly);
      }
      throw apiErr;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Timeout handling
    if (err.name === 'AbortError') {
      const timeoutErr = new ApiError(408, {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out after 15 seconds',
      });
      if (!skipErrorToast) {
        toast.error(getFriendlyErrorMessage('TIMEOUT_ERROR'));
      }
      throw timeoutErr;
    }

    // Network error retry for safe GET
    if (isSafeGet && retries < 2 && !(err instanceof ApiError)) {
      await new Promise((r) => setTimeout(r, 600 * (retries + 1)));
      return apiClient<T>(endpoint, { ...options, retries: retries + 1 });
    }

    // Offline / Network failure
    if (!(err instanceof ApiError)) {
      const netErr = new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network connection failed',
      });
      if (!skipErrorToast) {
        toast.error(getFriendlyErrorMessage('NETWORK_ERROR'));
      }
      throw netErr;
    }

    throw err;
  }
}
