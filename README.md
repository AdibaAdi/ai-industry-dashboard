# AI Industry Intelligence Dashboard

> A full-stack intelligence platform for exploring the AI company 
> landscape through curated analytics, search, and ML-assisted 
> classification.

🔗 **Live Demo:** https://ai-industry-dashboard.netlify.app

---

## What This Is

Most AI market dashboards are static snapshots. This is different — 
a working application with a live UI, a backend service layer, data 
enrichment flows, and Hugging Face-powered zero-shot classification.

Built to demonstrate practical product thinking, software architecture 
discipline, and deployable AI-enabled workflows.

---

## Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard Overview | KPIs, trend visuals, and summary intelligence cards |
| 🏢 Companies Explorer | Filter, rank, and drill into individual companies |
| 🧩 Domain Analysis | Market segmentation and distribution insights |
| 💼 Investor Mode | Scoring and decision-support style comparisons |
| 🌍 Market View | Landscape-level pattern analysis |
| 🤖 Ask AI | Retrieval-style company intelligence queries |
| 🎯 ML Classification | Hugging Face zero-shot domain/subdomain prediction |
| 📡 Live API | Backend-driven frontend with real endpoint consumption |
| 🔍 Data Quality | Confidence scores, source metadata, freshness indicators |

---

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts

### Backend
- Node.js (ES Modules)
- Route/controller/service architecture
- Domains, insights, investor mode, search, and ingestion services

### ML / NLP
- Hugging Face Inference API
- Zero-shot classification (`facebook/bart-large-mnli`)
- Confidence scoring with deterministic keyword fallback

### Deployment
- **Netlify** — frontend
- **Render** — backend API

---

## How the ML Layer Works

The intelligence layer is intentionally practical and transparent:

1. The backend builds classification text from company name, 
   description, and tags
2. **Hugging Face zero-shot classifier** predicts domain and subdomain
3. **Confidence scores** indicate signal strength for each prediction
4. If model inference is unavailable, deterministic fallback logic 
   kicks in using a maintained domain taxonomy and keyword scoring
5. Classification output feeds into enrichment and analytics pipelines

This design provides useful automation without overclaiming model 
capabilities.

---

## Architecture

```
React + Vite Frontend
        ↓
Node.js Backend API
        ↓
Data Services + Transformation Layer
        ↓
Hugging Face Classification Service
```

Netlify hosts the frontend. Render hosts the backend. Presentation 
and API concerns stay cleanly separated.

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-industry-dashboard

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`**
```env
PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:5173
HUGGINGFACE_API_KEY=your_hf_token_here
HUGGINGFACE_MODEL=facebook/bart-large-mnli
HUGGINGFACE_ROUTER_BASE_URL=https://router.huggingface.co
HUGGINGFACE_ROUTER_PROVIDER_PATH=/hf-inference/models
CLASSIFICATION_DEBUG=false
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_ENABLE_DEV_DIAGNOSTICS=true
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend runs at `http://localhost:5173`, calling backend at 
`http://localhost:4000`.

---

## Deployment

### Frontend (Netlify)
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment: set `VITE_API_BASE_URL` to your Render backend URL

### Backend (Render)
- Start command: `npm run start`
- Environment: set `CORS_ALLOWED_ORIGINS` to your Netlify domain
- Add Hugging Face keys in Render environment settings

---

## Project Structure

```
ai-industry-dashboard/
├── frontend/
│   └── src/
│       ├── api/          # API client
│       ├── components/   # Reusable UI components
│       ├── charts/       # Chart modules
│       ├── pages/        # Dashboard views
│       ├── hooks/        # Data orchestration hooks
│       └── utils/        # UI transformation helpers
├── backend/
│   └── src/
│       ├── api/
│       │   ├── controllers/  # Request handlers
│       │   └── routes/       # Endpoint map
│       ├── data/             # Seed data and repositories
│       ├── services/         # Domain logic, scoring, ML classification
│       ├── scripts/          # Validation scripts
│       └── server.js         # API bootstrap
├── netlify.toml
└── README.md
```

---

## Roadmap

- [ ] Embeddings-based retrieval and stronger RAG for Ask AI
- [ ] External market and funding data integrations
- [ ] Incremental refresh jobs with recency-aware scoring
- [ ] Expanded observability and data lineage tooling
- [ ] Dynamic ingestion connectors beyond static seeds

---

## License

MIT
```
