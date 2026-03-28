# AI Industry Intelligence Dashboard

A deployed, full-stack intelligence platform for exploring the AI company landscape through curated analytics, search, and machine-assisted classification. The app combines a production frontend, backend API, and data enrichment services into a single dashboard experience designed for real-world use. It includes live analytics views, backend-driven aggregation, data quality indicators, and Hugging Face powered zero-shot classification for domain tagging and confidence scoring. This project is built to demonstrate practical product thinking, software architecture discipline, and deployable AI-enabled workflows.

---

## Live Demo

**Frontend (Netlify):** https://ai-industry-dashboard.netlify.app/  
**Backend (Render):** Deployed API service consumed by the frontend

> The frontend is hosted on Netlify and configured to call a Render-hosted backend API.

---

## Why this project matters

Most AI market dashboards are static snapshots. This project is different: it is a working application with a live UI, a backend service layer, ingestion and enrichment flows, and model-assisted classification.

It helps users quickly explore:
- AI companies and their positioning
- Domain and subdomain concentration
- Investor-oriented signals and ranking views
- Emerging trends across segments

In plain terms, this is not just charts over a JSON file. It is a deployed product that connects user-facing exploration with backend analytics, automated intelligence enrichment, and production-style infrastructure.

---

## Key Features

- **Dashboard overview** with KPIs, trend visuals, and summary intelligence cards
- **Companies explorer** with filtering, ranking context, and detailed company drill-down
- **Domain analysis** for market segmentation and distribution insights
- **Investor Mode** focused on scoring and decision-support style comparisons
- **Market View** for landscape-level pattern analysis
- **Ask AI** interface for retrieval-style company intelligence queries
- **Confidence and source metadata** surfaced alongside enriched records
- **Data freshness indicators** to communicate recency and trust context
- **Hugging Face ML classification** for domain and subdomain prediction
- **API-driven frontend** that consumes live backend endpoints

---

## Tech Stack

### Frontend
- React 18
- Vite
- Recharts
- Tailwind CSS

### Backend
- Node.js (ES Modules)
- Lightweight HTTP server and route/controller architecture
- Service layer for domains, insights, investor mode, search, and ingestion

### ML / NLP
- Hugging Face Inference API
- Zero-shot classification (`facebook/bart-large-mnli` by default)
- Confidence scoring and fallback taxonomy/keyword logic

### Deployment
- Netlify (frontend)
- Render (backend API)

### Testing / Validation
- Node test runner for frontend and backend tests
- API contract integration tests
- Data integrity validation scripts

---

## Architecture Overview

High-level flow:

1. **React + Vite frontend** renders dashboards, explorer views, and AI query UX.
2. **Node backend API** exposes structured endpoints for companies, domains, insights, investor mode, search, and health.
3. **Data services and transformation layer** normalize, enrich, score, and aggregate records for UI consumption.
4. **Hugging Face classification service** predicts domain/subdomain labels and attaches confidence metadata.
5. **Deployment split** keeps presentation and API concerns clean: Netlify for frontend, Render for backend.

This architecture keeps the UI responsive while centralizing business logic and enrichment in backend services.

---

## ML / Intelligence Layer

The intelligence layer is intentionally practical and transparent.

- The backend builds classification text from company name, description, and tags.
- A **Hugging Face zero-shot classifier** predicts the most likely domain and subdomain.
- The system records **confidence scores** to indicate signal strength.
- If external model inference is unavailable, the service uses deterministic fallback logic based on a maintained domain taxonomy and keyword scoring.
- Classification output is fed into enrichment and analytics pipelines so downstream views remain consistent.

This design provides useful automation without overclaiming model capabilities.

---

## Screenshots

_Add screenshots here as the UI evolves._

### Dashboard Overview
![Dashboard Overview](./docs/screenshots/dashboard-overview.png)

### Investor Mode
![Investor Mode](./docs/screenshots/investor-mode.png)

### Market View
![Market View](./docs/screenshots/market-view.png)

### Ask AI
![Ask AI](./docs/screenshots/ask-ai.png)

### Domains View
![Domains View](./docs/screenshots/domains-view.png)

---

## Local Development

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd ai-industry-dashboard

cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables

Create local env files:

```bash
# from repo root
cat > backend/.env <<'ENV'
PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:5173
HUGGINGFACE_API_KEY=your_hf_token_here
HUGGINGFACE_MODEL=facebook/bart-large-mnli
HUGGINGFACE_ROUTER_BASE_URL=https://router.huggingface.co
HUGGINGFACE_ROUTER_PROVIDER_PATH=/hf-inference/models
CLASSIFICATION_DEBUG=false
ENV

cat > frontend/.env <<'ENV'
VITE_API_BASE_URL=http://localhost:4000
VITE_ENABLE_DEV_DIAGNOSTICS=true
ENV
```

### 3) Run backend

```bash
cd backend
npm run dev
```

### 4) Run frontend

```bash
cd frontend
npm run dev
```

The frontend runs on Vite (default `http://localhost:5173`) and calls the backend API at `http://localhost:4000`.

---

## Environment Variables

Use these as templates only. Do not commit real secrets.

### `backend/.env` example

```env
PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:5173
HUGGINGFACE_API_KEY=your_huggingface_token
HUGGINGFACE_MODEL=facebook/bart-large-mnli
HUGGINGFACE_ROUTER_BASE_URL=https://router.huggingface.co
HUGGINGFACE_ROUTER_PROVIDER_PATH=/hf-inference/models
CLASSIFICATION_DEBUG=false
```

### `frontend/.env` example

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_ENABLE_DEV_DIAGNOSTICS=true
```

---

## Deployment

### Frontend on Netlify
- Set base directory to `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` to your Render backend URL

### Backend on Render
- Deploy the `backend` service
- Start command: `npm run start`
- Set `CORS_ALLOWED_ORIGINS` to your Netlify domain
- Configure Hugging Face and any additional service keys in Render environment settings

---

## Project Structure

```text
ai-industry-dashboard/
├─ frontend/
│  ├─ src/
│  │  ├─ api/                # API client
│  │  ├─ components/         # Reusable UI components
│  │  ├─ charts/             # Chart modules
│  │  ├─ pages/              # Dashboard views (Companies, Domains, Investor Mode, Ask AI, etc.)
│  │  ├─ hooks/              # Data orchestration hooks
│  │  └─ utils/              # UI transformation and confidence helpers
│  └─ test/                  # Frontend smoke tests
├─ backend/
│  ├─ src/
│  │  ├─ api/
│  │  │  ├─ controllers/     # Request handlers
│  │  │  └─ routes/          # Route matching and endpoint map
│  │  ├─ data/               # Seed data, repository and data connector scaffolds
│  │  ├─ services/           # Domain logic, scoring, ingestion, search, retrieval, ML classification
│  │  ├─ scripts/            # Validation and sample classification scripts
│  │  ├─ utils/              # HTTP and query utility helpers
│  │  └─ server.js           # API bootstrap
│  └─ test/                  # Integration and service tests
├─ netlify.toml              # Netlify build config
└─ README.md
```

---

## Future Improvements

- Embeddings-based retrieval and stronger RAG orchestration for Ask AI
- Richer external market and funding data integrations
- Expanded diagnostics, observability, and data lineage tooling
- More dynamic ingestion connectors beyond static seeds and fixtures
- Incremental refresh jobs and smarter recency-aware scoring

---

## License

Add a license section here if you plan to open source this project publicly.
