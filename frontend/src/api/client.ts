import type { StandardError } from './types';

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

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

  const token = localStorage.getItem('ralypto_token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let errorData: StandardError = {
      code: 'HTTP_ERROR',
      message: `Request failed with status ${response.status}`,
    };
    try {
      const parsed = await response.json();
      if (parsed.message || parsed.code) {
        errorData = parsed;
      }
    } catch {
      // JSON parse error, use fallback
    }
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
