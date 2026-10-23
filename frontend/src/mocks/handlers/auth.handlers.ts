import { http, HttpResponse } from 'msw';
import {
  MOCK_USERS,
  MOCK_RESTAURANT,
} from '../data/mockData';
import { PLAN_FEATURE_FLAGS_MAP } from '../../stores/auth.store';
import type { Plan } from '../../api/types';

export const authHandlers = [
  // Email/Password Login
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const foundEntry = Object.values(MOCK_USERS).find(
      (u) => u.user.email.toLowerCase() === body.email?.toLowerCase() && u.password === body.password
    );

    if (!foundEntry) {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const defaultPlan: Plan = {
      id: 'plan-std',
      code: 'standard',
      name: 'Standard Plan',
      monthlyPriceCents: 2450000,
    };

    return HttpResponse.json({
      accessToken: 'mock-jwt-token-' + foundEntry.user.id,
      refreshToken: 'mock-refresh-token-' + foundEntry.user.id,
      user: foundEntry.user,
      restaurant: MOCK_RESTAURANT,
      plan: defaultPlan,
      featureFlags: PLAN_FEATURE_FLAGS_MAP['standard'],
    });
  }),

  // Terminal 4-digit PIN Login
  http.post('*/auth/pin-login', async ({ request }) => {
    const body = (await request.json()) as { restaurantCode?: string; pin?: string };

    if (body.restaurantCode?.toUpperCase() !== MOCK_RESTAURANT.code) {
      return HttpResponse.json(
        { code: 'INVALID_RESTAURANT', message: 'Restaurant code not found' },
        { status: 401 }
      );
    }

    const foundEntry = Object.values(MOCK_USERS).find((u) => u.pin === body.pin);

    if (!foundEntry) {
      return HttpResponse.json(
        { code: 'INVALID_PIN', message: 'Invalid 4-digit staff PIN' },
        { status: 401 }
      );
    }

    const defaultPlan: Plan = {
      id: 'plan-std',
      code: 'standard',
      name: 'Standard Plan',
      monthlyPriceCents: 2450000,
    };

    return HttpResponse.json({
      accessToken: 'mock-jwt-token-' + foundEntry.user.id,
      refreshToken: 'mock-refresh-token-' + foundEntry.user.id,
      user: foundEntry.user,
      restaurant: MOCK_RESTAURANT,
      plan: defaultPlan,
      featureFlags: PLAN_FEATURE_FLAGS_MAP['standard'],
    });
  }),

  // Get Me Session
  http.get('*/auth/me', () => {
    return HttpResponse.json({
      user: MOCK_USERS.owner.user,
      restaurant: MOCK_RESTAURANT,
      plan: {
        id: 'plan-std',
        code: 'standard',
        name: 'Standard Plan',
        monthlyPriceCents: 2450000,
      },
      featureFlags: PLAN_FEATURE_FLAGS_MAP['standard'],
    });
  }),
];
