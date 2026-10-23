# Ralypto - Subscription Plans & Feature Flag Architecture

Ralypto operates on a multi-tenant Software-as-a-Service (SaaS) model with three monthly subscription tiers: **Basic**, **Standard**, and **Premium**.

---

## 1. Plan Feature Comparison Matrix

| Capability / Module | Basic Plan | Standard Plan | Premium Plan |
| :--- | :---: | :---: | :---: |
| **Pricing (Monthly)** | LKR 12,500 / mo | LKR 24,500 / mo | LKR 48,000 / mo |
| **Included User Seats** | Up to 3 users | Up to 10 users | Unlimited users |
| **Branch Outlets** | 1 Branch | 1 Branch | Multi-branch (included) |
| **POS Billing & Offline Mode** | Included | Included | Included |
| **Kitchen Display (KDS)** | Included | Included | Included |
| **Digital QR Menu** | View-Only | Self-Ordering & Waiter Call | Self-Ordering & AI Upsell |
| **Waiter Mobile Ordering App** | Locked | Included | Included |
| **Inventory & Recipe Costing (GRN)** | Locked | Included | Included |
| **Delivery Orders (Uber Eats / PickMe)**| Locked | Included | Included |
| **Reporting Suite** | 10 Basic Reports | 35+ Standard Reports | 35+ Reports + Custom Builder |
| **Accounting & Double-Entry Ledger** | Locked | Locked | Included |
| **HR, Attendance & Payroll** | Locked | Locked | Included |
| **AI Stock Prediction & Demand** | Locked | Basic Low-Stock Alerts | Full Predictive AI |
| **AI Sales Assistant & Menu Insights** | Locked | Locked | Included |
| **AI Photo Menu Digitizer** | Locked | Locked | Included |
| **Support SLA** | Business Hours (Email) | Priority WhatsApp Support | 24/7 Dedicated WhatsApp & Phone |

---

## 2. Feature Flag Keys

The backend returns a boolean map of feature flags inside the `GET /api/v1/auth/me` and `GET /api/v1/subscription` responses. The frontend uses these keys via the `useFeature(flagKey)` hook and the `<RequirePlanFeature feature="flagKey">` route guard:

| Feature Flag Key | Type | Description |
| :--- | :--- | :--- |
| `pos_billing` | `boolean` | Access to POS register, cash drawer, and shift billing. |
| `kitchen_display` | `boolean` | Access to the live KDS ticket dispatch board. |
| `qr_menu_view` | `boolean` | Public digital QR menu browsing. |
| `qr_self_order` | `boolean` | Customer table ordering directly from QR web app. |
| `waiter_app` | `boolean` | Access to mobile/tablet waiter ordering flow. |
| `inventory_management` | `boolean` | Stock catalog, GRN receiving, recipes, wastage tracking. |
| `delivery_integration` | `boolean` | Third-party delivery aggregator order management. |
| `advanced_reports` | `boolean` | Access to 35+ analytical reports and P&L exports. |
| `accounting_ledger` | `boolean` | Double-entry journal, balance sheet, and expenses. |
| `hr_payroll` | `boolean` | Staff attendance logging, wage calculations, and payroll. |
| `multi_branch` | `boolean` | Multi-outlet switching and aggregated reporting. |
| `ai_assistant` | `boolean` | Natural language sales assistant and menu insights. |
| `ai_stock_prediction` | `boolean` | Demand forecasting and predictive replenishment. |
| `ai_menu_builder` | `boolean` | Photo menu OCR and automated catalog parsing. |

### Feature Flag Schema Example
```json
{
  "plan": "standard",
  "featureFlags": {
    "pos_billing": true,
    "kitchen_display": true,
    "qr_menu_view": true,
    "qr_self_order": true,
    "waiter_app": true,
    "inventory_management": true,
    "delivery_integration": true,
    "advanced_reports": true,
    "accounting_ledger": false,
    "hr_payroll": false,
    "multi_branch": false,
    "ai_assistant": false,
    "ai_stock_prediction": false,
    "ai_menu_builder": false
  }
}
```

---

## 3. Subscription Lifecycle & Grace Period Rules

1. **Billing Cycle**: Subscriptions are billed on the 1st of every calendar month.
2. **Payment Methods**: PayHere (Credit/Debit cards) or Direct Bank Wire with payment slip verification.
3. **Grace Period (7 Days)**:
   - If an invoice is unpaid on the due date, the tenant enters **Grace Period** for 7 calendar days.
   - All modules remain fully functional.
   - A non-intrusive banner is displayed to Owner and Manager roles with invoice details and quick pay link.
4. **Read-Only Lockout (Day 8+)**:
   - If payment is not cleared by Day 8, the tenant status changes to `past_due`.
   - The entire application transitions to **Read-Only Mode**:
     - Staff can log in and view historical reports, past orders, and inventory numbers.
     - New order creation, table bill settlements, and inventory adjustments are blocked with code `SUBSCRIPTION_REQUIRED`.
5. **Data Retention Policy**:
   - **Tenant data is NEVER deleted due to non-payment**.
   - All records, recipes, transaction history, and accounting books remain safely preserved in PostgreSQL indefinitely.
   - Upon invoice settlement, full access is restored immediately.
