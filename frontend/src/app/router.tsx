import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import { RequirePlanFeature } from "./guards/RequirePlanFeature";
import { PageLoading } from "../components/common/Skeleton";

// Lazy-loaded routes for small initial bundle size
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const PinLoginPage = lazy(() => import("../features/auth/PinLoginPage"));
const TablesPage = lazy(() => import("../features/pos/TablesPage"));
const PosPage = lazy(() => import("../features/pos/PosPage"));
const OrderHistoryPage = lazy(() => import("../features/orders/OrderHistoryPage"));
const KitchenPage = lazy(() => import("../features/kitchen/KitchenPage"));
const WaiterPage = lazy(() => import("../features/waiter/WaiterPage"));
const QrMenuPage = lazy(() => import("../features/qr-menu/QrMenuPage"));
const MenuManagerPage = lazy(() => import("../features/menu-manager/MenuManagerPage"));
const ReportsPage = lazy(() => import("../features/reports/ReportsPage"));
const InventoryPage = lazy(() => import("../features/inventory/InventoryPage"));
const AccountingPage = lazy(() => import("../features/accounting/AccountingPage"));
const DeliveryPage = lazy(() => import("../features/delivery/DeliveryPage"));
const StaffPage = lazy(() => import("../features/staff/StaffPage"));
const AiAssistantPage = lazy(() => import("../features/ai/AiAssistantPage"));
const SubscriptionPage = lazy(() => import("../features/subscription/SubscriptionPage"));
const UpgradePage = lazy(() => import("../features/subscription/UpgradePage"));
const ReservationsPage = lazy(() => import("../features/reservations/ReservationsPage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage"));
const AdminPage = lazy(() => import("../features/admin/AdminPage"));
const OnboardingPage = lazy(() => import("../features/onboarding/OnboardingPage"));

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/pin-login",
    element: (
      <Suspense fallback={<PageLoading />}>
        <PinLoginPage />
      </Suspense>
    ),
  },

  // Public QR Menu (Zero authentication required)
  {
    path: "/qr/:restaurantCode/:tableNumber",
    element: (
      <Suspense fallback={<PageLoading />}>
        <QrMenuPage />
      </Suspense>
    ),
  },
  {
    path: "/qr",
    element: (
      <Suspense fallback={<PageLoading />}>
        <QrMenuPage />
      </Suspense>
    ),
  },

  // Protected Core Application Routes
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <ReportsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "tables",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "cashier", "waiter", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <TablesPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "reservations",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "cashier", "waiter", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <ReservationsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "billing",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "cashier", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <PosPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "pos",
        element: <Navigate to="/billing" replace />,
      },
      {
        path: "orders",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "cashier", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <OrderHistoryPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "kitchen",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "kitchen", "cashier", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <KitchenPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "waiter",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "waiter", "super_admin"]}>
            <RequirePlanFeature
              feature="waiter_app"
              featureTitle="Waiter Mobile Ordering App"
              minPlanName="Standard Plan"
            >
              <Suspense fallback={<PageLoading />}>
                <WaiterPage />
              </Suspense>
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: "menu",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <MenuManagerPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "menu-manager",
        element: <Navigate to="/menu" replace />,
      },
      {
        path: "stock",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "accountant", "super_admin"]}>
            <RequirePlanFeature
              feature="inventory_management"
              featureTitle="Inventory & Recipe Depletion"
              minPlanName="Standard Plan"
            >
              <Suspense fallback={<PageLoading />}>
                <InventoryPage />
              </Suspense>
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: "inventory",
        element: <Navigate to="/stock" replace />,
      },
      {
        path: "accounts",
        element: (
          <RequireRole allowedRoles={["owner", "accountant", "super_admin"]}>
            <RequirePlanFeature
              feature="accounting_ledger"
              featureTitle="Double-Entry Accounting & Payroll"
              minPlanName="Premium Plan"
            >
              <Suspense fallback={<PageLoading />}>
                <AccountingPage />
              </Suspense>
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: "accounting",
        element: <Navigate to="/accounts" replace />,
      },
      {
        path: "delivery",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "cashier", "super_admin"]}>
            <RequirePlanFeature
              feature="delivery_integration"
              featureTitle="Delivery Integrations (Uber Eats / PickMe)"
              minPlanName="Standard Plan"
            >
              <Suspense fallback={<PageLoading />}>
                <DeliveryPage />
              </Suspense>
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: "staff",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <StaffPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "reports",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "ai",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "super_admin"]}>
            <RequirePlanFeature
              feature="ai_assistant"
              featureTitle="Ralypto AI Assistant & Analytics"
              minPlanName="Standard Plan"
            >
              <Suspense fallback={<PageLoading />}>
                <AiAssistantPage />
              </Suspense>
            </RequirePlanFeature>
          </RequireRole>
        ),
      },
      {
        path: "subscription",
        element: (
          <RequireRole allowedRoles={["owner", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <SubscriptionPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "upgrade",
        element: (
          <Suspense fallback={<PageLoading />}>
            <UpgradePage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireRole allowedRoles={["owner", "manager", "super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <SettingsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireRole allowedRoles={["super_admin"]}>
            <Suspense fallback={<PageLoading />}>
              <AdminPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: "onboarding",
        element: (
          <Suspense fallback={<PageLoading />}>
            <OnboardingPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
