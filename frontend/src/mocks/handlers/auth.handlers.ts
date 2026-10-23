import { http, HttpResponse } from 'msw';
import {
  MOCK_USERS,
  MOCK_RESTAURANT,
  getMockRestaurantPlan,
  getMockPlanCode,
} from '../data/mockData';
import { PLAN_FEATURE_FLAGS_MAP } from '../../stores/auth.store';

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

    const currentPlan = getMockRestaurantPlan();
    const planCode = getMockPlanCode();

    return HttpResponse.json({
      accessToken: 'mock-jwt-token-' + foundEntry.user.id,
      refreshToken: 'mock-refresh-token-' + foundEntry.user.id,
      user: foundEntry.user,
      restaurant: MOCK_RESTAURANT,
      plan: currentPlan,
      featureFlags: PLAN_FEATURE_FLAGS_MAP[planCode],
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

    // Support both 1111 and 1234 for owner
    let foundEntry = Object.values(MOCK_USERS).find((u) => u.pin === body.pin);
    if (!foundEntry && body.pin === '1234') {
      foundEntry = MOCK_USERS.owner;
    }

    if (!foundEntry) {
      return HttpResponse.json(
        { code: 'INVALID_PIN', message: 'Invalid 4-digit staff PIN' },
        { status: 401 }
      );
    }

    const currentPlan = getMockRestaurantPlan();
    const planCode = getMockPlanCode();

    return HttpResponse.json({
      accessToken: 'mock-jwt-token-' + foundEntry.user.id,
      refreshToken: 'mock-refresh-token-' + foundEntry.user.id,
      user: foundEntry.user,
      restaurant: MOCK_RESTAURANT,
      plan: currentPlan,
      featureFlags: PLAN_FEATURE_FLAGS_MAP[planCode],
    });
  }),

  // Get Me Session
  http.get('*/auth/me', () => {
    const currentPlan = getMockRestaurantPlan();
    const planCode = getMockPlanCode();

    return HttpResponse.json({
      user: MOCK_USERS.owner.user,
      restaurant: MOCK_RESTAURANT,
      plan: currentPlan,
      featureFlags: PLAN_FEATURE_FLAGS_MAP[planCode],
    });
  }),
];
