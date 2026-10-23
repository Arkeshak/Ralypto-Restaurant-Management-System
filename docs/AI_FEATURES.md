# Ralypto - AI & Voice Intelligence Suite

> **"Just talk to Ralypto."**  
> An intelligent voice-first restaurant operating system designed specifically for Sri Lankan hospitality—mastering English, Sinhala, Tamil, and local colloquial phrasing ("kottu ekak", "no spicy", "table for 4 tomorrow 7pm").

---

## 1. Core Operating Rules for All AI & Voice Features

1. **AI Proposes, Human Confirms**:
   - Voice interaction creates an editable **draft** (draft order, draft table reservation).
   - Staff or customer taps "Confirm". Voice never auto-commits a payment or dispatches an order unchecked.
2. **Backend API Isolation**:
   - The AI agent never touches the database directly. It executes strictly through the same backend REST Tools API as authenticated users, respecting the calling user's role and tenant permissions.
3. **No Hallucinated Facts**:
   - Prices, dish availability, table occupancy, and revenue statistics come strictly from live system database queries, never from the LLM's generative memory.
4. **Dangerous Actions Require Manual Touch + Manager PIN**:
   - The following operations **can never be triggered by voice alone**:
     - Processing payments or refunds.
     - Voiding or canceling orders.
     - Modifying menu prices.
     - Deleting staff, tables, or categories.
5. **Full Audit Logging**:
   - Every AI-initiated draft or action is tagged with `actor_type: "ai"` and logs the user ID, original transcript, tool called, and timestamp.
6. **Graceful Offline Fallback**:
   - Voice requires connectivity. If offline or if the AI service drops, the standard manual touch interface (keypads, buttons, menus) continues working without interruption.
7. **Ergonomic Push-to-Talk**:
   - Staff interact using single-tap or push-to-talk buttons with live visual waveform feedback. No continuous eavesdropping.

---

## 2. Action Classification: Safe vs. Confirm

| Action | Execution Rule | Safety Constraint |
| :--- | :--- | :--- |
| **Read reports & stats** ("Today's sales", "Best sellers") | Immediate response | Read-only |
| **Mark item sold-out** ("Chicken is 86") | Immediate update with toast | Reversible via single tap |
| **Screen navigation** ("Show Table 5", "Open Kitchen") | Immediate transition | Zero data impact |
| **Create order or booking** | **Show Draft Sheet -> Human taps Confirm** | Prevents misheard items |
| **Move table or cancel reservation** | **Show confirmation modal -> Human taps Confirm** | Operational impact check |
| **Payments, refunds, voids, price changes** | **Manual screen interaction + 4-digit Manager PIN** | **Voice strictly prohibited** |

---

## 3. The 5 Hero Features (3-Minute Sales Demo)

### Hero 1: AI Booking Agent (Web Widget, WhatsApp, Inbound Telephony)
- **Customer Experience**: Customer speaks or types: *"Table for 4 tomorrow at 7:30 PM."*
- **Execution Flow**:
  1. AI calls `check_table_availability(date="tomorrow", time="19:30", guests=4)`.
  2. If free, AI calls `create_booking(...)` and issues a confirmation code via WhatsApp / SMS.
  3. Booking instantly appears on the restaurant's live Reservations timeline.
- **Channels**:
  1. *Channel 1 (Immediate)*: Web voice & chat widget on restaurant website, QR menu, and Instagram bio link.
  2. *Channel 2*: WhatsApp Business API integration.
  3. *Channel 3*: Inbound phone calls with voice AI greeting: *"You are speaking with the AI assistant for Ceylon Flavors..."*

### Hero 2: Waiter Voice Order (Push-to-Talk)
- **Waiter Experience**: In a noisy dining room, the waiter holds the mic button:  
  *"Table 5, two chicken kottu spicy, one seafood fried rice, three fresh lime juices."*
- **Execution Flow**:
  1. Speech-to-text transcribes audio.
  2. NLP matches spoken dish names against menu aliases (`kottu`, `chicken kothu`, `කොත්තු`, `கொத்து`).
  3. Draft Review Sheet opens on waiter's phone showing Table 5, items, and note *"spicy"*.
  4. Waiter verifies in 2 seconds and taps **"Send to Kitchen"**. Kitchen chime rings immediately.

### Hero 3: Voice Order on Public QR Menu
- **Diner Experience**: Guest sits at Table 3, taps the microphone icon on their smartphone, and speaks in English or Sinhala (*"චිකන් කොත්තු එකක් සහ අයිස් මයිලෝ එකක්"*).
- **Execution Flow**:
  1. Spoken audio is matched to menu catalog.
  2. Customer's digital cart populates automatically with items and prices.
  3. Customer reviews the visual cart and taps **"Confirm Order"**.

### Hero 4: "Ask Ralypto" Executive Assistant + Morning WhatsApp Briefing
- **Owner Experience**: Owner taps the mic on the Dashboard:  
  *"Why were sales lower on Tuesday compared to last week?"*
- **Execution Flow**:
  1. AI analyzes sales, weather flags, Poya holidays, and average bill sizes.
  2. Generates plain-language executive summary with an interactive mini Recharts visualization.
  3. Every morning at 7:00 AM, Ralypto sends a WhatsApp briefing: yesterday's revenue, best/worst items, low stock warnings, today's reservations, and actionable operational advice.

### Hero 5: Demand Forecast + Kitchen Daily Prep List & Supplier Draft
- **Chef Experience**: Kitchen supervisor opens the daily prep list.
- **Execution Flow**:
  1. System forecasts day's orders based on historical day-of-week averages, Poya holidays, and current reservations.
  2. Outputs exact prep targets: *"Prepare 35 chicken kottu portions, 25 kg chopped leeks, 40 hoppers"*.
  3. If ingredient inventory is depleting (*"Chicken will finish in 48 hours"*), drafts a supplier WhatsApp purchase order for the manager to send in one tap.

---

## 4. Voice Processing Pipeline

```
[ Frontend: MicButton ]
      │ (Push-to-Talk Audio Stream or Web Speech API)
      ▼
[ Speech-to-Text Engine ]  (Fast Whisper / Whisper Cloud / Browser STT)
      │
      ▼
[ NLP / LLM Function-Calling Agent ]
      │ (Tools: get_menu, check_table_availability, create_draft_order, etc.)
      ▼
[ Menu Alias Matcher ] (Fuzzy matching on multi-lingual aliases)
      │
      ▼
[ Frontend Draft Review Sheet ]
      │ (User reviews items, quantities, and cooking notes)
      ▼
[ User Taps "Confirm" ] ──► Dispatches to Backend API ──► Kitchen KDS rings
```

---

## 5. Backend Tools API Specification (For Backend Developer)

The AI service interacts with the core backend through standard authenticated tool endpoints:

1. `GET /api/v1/tools/menu-search?query=...`  
   Searches items across names and multi-lingual aliases.
2. `GET /api/v1/tools/table-availability?partySize=4&date=2026-10-24&time=19:30`  
   Returns available tables matching party capacity.
3. `POST /api/v1/tools/draft-order`  
   Creates an order with `status: "draft"` and `source: "voice_waiter"` or `"voice_qr"`.
4. `POST /api/v1/tools/draft-booking`  
   Creates a reservation with `status: "pending"` and `source: "web_voice"` or `"whatsapp"`.
5. `PATCH /api/v1/tools/menu-item/availability`  
   Toggles item 86/sold-out state via voice command.
6. `GET /api/v1/tools/sales-insights?period=last_7_days`  
   Returns structured revenue, voids, top items, and hour-by-hour totals for natural language synthesis.

---

## 6. Subscription Gating & Usage Limits

| AI Feature | Basic Plan | Standard Plan | Premium Plan | Add-On (Pay-as-you-go) |
| :--- | :---: | :---: | :---: | :---: |
| **Manual Reservations & Timeline** | Yes | Yes | Yes | - |
| **Waiter Voice Ordering** | No | 50 drafts/mo | Unlimited | LKR 5 / order |
| **QR Voice Ordering** | No | Yes | Yes | Included |
| **Ask Ralypto Chat & Voice** | No | 20 questions/mo | Unlimited (fair use) | LKR 10 / question |
| **Morning WhatsApp Briefing** | No | Yes | Yes | Included |
| **Demand Forecast & Prep List** | No | Basic weekday | Full ML + Holidays | - |
| **AI Booking Agent (Web & WhatsApp)** | No | No | Yes | Included |
| **AI Telephony Phone Agent** | No | No | Add-On | LKR 25 / minute |
