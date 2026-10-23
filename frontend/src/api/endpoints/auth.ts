import { apiClient } from '../client';
import type { AuthResponse, User, Restaurant, Plan, FeatureFlags } from '../types';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  pinLogin: (data: { restaurantCode: string; pin: string }) =>
    apiClient<AuthResponse>('/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshToken: (refreshToken: string) =>
    apiClient<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: () =>
    apiClient<{
      user: User;
      restaurant: Restaurant;
      plan: Plan;
      featureFlags: FeatureFlags;
    }>('/auth/me'),
};
