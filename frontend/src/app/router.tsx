import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { RequirePlanFeature } from './guards/RequirePlanFeature';

// Feature Pages
import { LoginPage } from '../features/auth/LoginPage';
import { PinLoginPage } from '../features/auth/PinLoginPage';
import { PosPage } from '../features/pos/PosPage';
import { WaiterPage } from '../features/waiter/WaiterPage';
import { KitchenPage } from '../features/kitchen/KitchenPage';
import { QrMenuPage } from '../features/qr-menu/QrMenuPage';
import { MenuManagerPage } from '../features/menu-manager/MenuManagerPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { AccountingPage } from '../features/accounting/AccountingPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { DeliveryPage } from '../features/delivery/DeliveryPage';
import { SubscriptionPage } from '../features/subscription/SubscriptionPage';
import { AiAssistantPage } from '../features/ai/AiAssistantPage';
import { AdminPage } from '../features/admin/AdminPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/pin-login',
    element: <PinLoginPage />,
  },

  // Public QR Menu (Zero authentication required)
  {
    path: '/qr/:restaurantCode/:tableNumber',
    element: <QrMenuPage />,
  },

  // Protected Core Application Routes
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/pos" replace />,
      },
      {
        path: 'pos',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'cashier', 'super_admin']}>
            <PosPage />
          </RequireRole>
        ),
      },
      {
        path: 'waiter',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'waiter', 'super_admin']}>
            <RequirePlanFeature
              feature="waiter_app"
              featureTitle="Waiter Mobile Ordering App"
              minPlanName="Standard Plan"
            >
              <WaiterPage />
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: 'kitchen',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'kitchen', 'cashier', 'super_admin']}>
            <KitchenPage />
          </RequireRole>
        ),
      },
      {
        path: 'qr-menu',
        element: <QrMenuPage />,
      },
      {
        path: 'menu-manager',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'super_admin']}>
            <MenuManagerPage />
          </RequireRole>
        ),
      },
      {
        path: 'inventory',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'accountant', 'super_admin']}>
            <RequirePlanFeature
              feature="inventory_management"
              featureTitle="Inventory & Recipe Depletion"
              minPlanName="Standard Plan"
            >
              <InventoryPage />
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: 'accounting',
        element: (
          <RequireRole allowedRoles={['owner', 'accountant', 'super_admin']}>
            <RequirePlanFeature
              feature="accounting_ledger"
              featureTitle="Double-Entry Accounting & Payroll"
              minPlanName="Premium Plan"
            >
              <AccountingPage />
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'accountant', 'super_admin']}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'accountant', 'super_admin']}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'delivery',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'cashier', 'super_admin']}>
            <RequirePlanFeature
              feature="delivery_integration"
              featureTitle="Delivery Integrations (Uber Eats / PickMe)"
              minPlanName="Standard Plan"
            >
              <DeliveryPage />
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: 'ai',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'super_admin']}>
            <RequirePlanFeature
              feature="ai_assistant"
              featureTitle="Gemini AI Hospitality Advisor"
              minPlanName="Premium Plan"
            >
              <AiAssistantPage />
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: 'subscription',
        element: (
          <RequireRole allowedRoles={['owner', 'super_admin']}>
            <SubscriptionPage />
          </RequireRole>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireRole allowedRoles={['owner', 'manager', 'super_admin']}>
            <SettingsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireRole allowedRoles={['super_admin']}>
            <AdminPage />
          </RequireRole>
        ),
      },
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/pos" replace />,
  },
]);
