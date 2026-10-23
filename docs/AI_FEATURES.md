# Ralypto - AI Features Architecture & Intelligence Suite

Ralypto leverages Google Gemini models to deliver actionable business intelligence for restaurant owners, managers, and staff.

> [!IMPORTANT]
> **Backend-Only AI Execution**: The frontend **never** connects directly to Google Gemini and never holds the `GEMINI_API_KEY`. All prompts, token streaming, context assembly, and model invocations happen strictly within the secure backend service. The frontend simply interacts with sanitized REST/SSE endpoints.

---

## 1. Feature Catalog, Data Requirements & Subscription Tiers

| AI Feature | Description | Required Input Data | Target Plan |
| :--- | :--- | :--- | :---: |
| **Sales Assistant Chat** | Natural language conversational bot answering operational queries (e.g. "What was our highest margin dish this weekend?"). | Aggregated sales, hourly transactions, menu item margins, shift summaries. | **Premium** |
| **Stock Demand Forecast** | Predictive procurement engine that alerts owners before ingredients run out. | Historical order volume, recipe BOM ingredient usage, day of week, weather/holidays. | **Premium** *(Basic static alerts in Standard)* |
| **Menu Engineering Matrix** | Classifies menu into Stars, Plowhorses, Puzzles, and Dogs based on BCG matrix. | Menu sales volume, food cost %, gross margin, order frequency. | **Premium** |
| **AI Menu Builder from Photo** | Vision OCR that converts a photo or PDF of a printed menu into categories, items, and LKR prices. | Uploaded image file (JPEG/PNG). | **Premium** |
| **Voice & Fast Text Ordering** | Natural language order transcription for cashiers and waiters (e.g. "2 chicken kottu spicy, 1 lime juice no sugar"). | Audio stream or quick text prompt string. | **Premium** |
| **Customer Feedback Summarizer** | Aggregates hundreds of customer QR reviews into recurring themes and kitchen actionable notes. | Star ratings, customer text comments, dish mentions. | **Premium** |
| **Operational Fraud Alerts** | Detects abnormal cashier behaviors (e.g. frequent manager voids, repetitive cash drawer pops). | Shift cash drawer movements, void counts, discount patterns, audit logs. | **Premium** |
| **Smart Upsell Suggestions** | Contextual pairing suggestions presented to cashier/waiter (e.g. "Customer ordered Kottu -> Suggest Iced Tea or Extra Cheese"). | Current order cart items, historical co-purchase affinity graph. | **Premium** |

---

## 2. Technical Architecture & Data Security

### Backend AI Gateway Pattern
```
[ Frontend Client ]
        │  (Authenticated JWT Bearer)
        ▼
[ Backend AI Controller ]
        │
        ├── 1. Verify Tenant Subscription has 'ai_assistant' feature flag
        ├── 2. Query Tenant PostgreSQL data (Strict multi-tenant isolation by restaurant_id)
        ├── 3. Redact any Personal Identifiable Information (PII) like customer names/cards
        ├── 4. Construct System Prompt with injected context & schema definition
        │
        ▼
[ Google Gemini API (GEMINI_API_KEY) ]
        │
        ▼
[ Backend Sanitizer & JSON Validator ]
        │
        ▼
[ Frontend Display (Cards, Insights, Assistant Chat) ]
```

---

## 3. Sample Prompt Construction

### Feature: Menu Engineering Insights
- **Endpoint**: `GET /api/v1/ai/menu-insights`
- **Context Assembled by Backend**:
  ```json
  {
    "period": "Last 30 Days",
    "topItems": [
      { "name": "Chicken Kottu", "sold": 412, "margin_percent": 68 },
      { "name": "Seafood Fried Rice", "sold": 380, "margin_percent": 72 },
      { "name": "Devilled Prawns", "sold": 34, "margin_percent": 78 },
      { "name": "Vegetable Roti", "sold": 550, "margin_percent": 35 }
    ]
  }
  ```
- **Gemini System Instruction**:
  > "You are an expert restaurant consultant. Analyze the provided dish sales and profit margins. Categorize dishes into Stars (high profit, high popularity), Plowhorses (low profit, high popularity), Puzzles (high profit, low popularity), and Dogs (low profit, low popularity). Return a concise 3-point action plan."
