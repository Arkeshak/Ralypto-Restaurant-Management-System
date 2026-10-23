# Ralypto AI Service (Python / FastAPI)

The intelligence layer for Ralypto Restaurant Management System ("Just talk to Ralypto").

## Responsibilities
1. **Push-to-Talk & Voice Pipeline**: Multi-lingual speech-to-text (English, Sinhala, Tamil) and menu alias fuzzy matching.
2. **LLM Tool Calling**: Executes structured tool calls against the Backend REST Tools API (`/api/v1/tools/*`). Strictly adheres to **ADR 018**: "AI never touches the database directly. AI proposes, human confirms."
3. **Machine Learning Heuristics**: Demand forecasting based on historical sales, day of week, Sri Lankan Poya days, and weather. Generates kitchen morning prep lists and supplier purchase drafts.

---

## Directory Structure
```
ai-service/
├── app/
│   ├── main.py        # FastAPI endpoints (/health, /api/v1/agent/query, /api/v1/ml/forecast)
│   ├── tools.py       # JSON schema & execution client for backend Tools API
│   └── forecast.py    # Demand forecasting algorithm & Poya Day calendar
├── requirements.txt   # Python dependencies (FastAPI, uvicorn, pydantic, httpx, numpy)
└── README.md          # This setup guide
```

---

## Quick Start

### 1. Create a Python Virtual Environment
```bash
cd ai-service
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open interactive Swagger API documentation at: **`http://localhost:8000/docs`**

---

## Architecture Flow

```
[ Frontend: MicButton ]
         │ (audio / transcript)
         ▼
[ AI Service: /api/v1/agent/query ]
         │ (tool call: get_sales_summary / check_table_availability)
         ▼
[ Core Backend Tools API ] ───▶ [ PostgreSQL + Redis ]
         │ (grounded real data)
         ▼
[ AI Service synthesizes response ]
         │ (editable draft / analytical chart)
         ▼
[ Frontend: Draft Review Sheet ] ──▶ Staff or Diner Taps "Confirm"
```

---

## Principles & Guardrails
- **AI Proposes, Human Confirms**: Orders and bookings are created in `draft` status.
- **Sensitive Operations Locked**: Payments, voids, refunds, and price modifications can NEVER be initiated by voice alone; they require physical tap + 4-digit Manager PIN.
- **No Hallucinations**: Menu prices and table availability are pulled directly from backend APIs.
