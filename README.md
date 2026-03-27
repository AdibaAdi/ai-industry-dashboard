# AI Industry Intelligence Dashboard

A production-minded AI company intelligence dashboard with a serverless-ready API layer, modular data services, and a frontend fully wired to backend data endpoints.

## Architecture

```text
backend/
  src/data/companies.js              # Canonical seed dataset (40+ companies)
  src/services/companyRepository.js  # Repository abstraction (future DB swap)
  src/services/scoringService.js     # Power score normalization/logic
  src/services/domainService.js      # Domain aggregations and leader extraction
  src/services/insightsService.js    # Portfolio insights generation
  src/server.js                      # HTTP API routes

frontend/
  src/api/client.js                  # API client layer
  src/hooks/useDashboardData.js      # Data orchestration + loading/error handling
  src/utils/transformers.js          # API-to-UI transformation layer
  src/pages + src/components + charts # Presentation/UI
```

## API Endpoints

- `GET /companies`
- `GET /companies/:id`
- `GET /domains`
- `GET /insights`
- `GET /health`

### Query support on `/companies`

- `domain`
- `search`
- `sortBy` (default `power_score`)
- `order` (`asc` / `desc`)

## Data model

Each company record includes:

- `id`
- `name`
- `description`
- `website`
- `domain`
- `subdomain`
- `founded_year`
- `headquarters`
- `funding`
- `valuation`
- `company_type`
- `growth_score`
- `influence_score`
- `power_score`
- `source_urls`
- `tags`
- `last_updated`

## Local development

### 1) Start backend API

```bash
cd backend
npm run start
```

### 2) Start frontend

```bash
cd frontend
npm run dev
```

If your API runs on a non-default URL, set:

```bash
VITE_API_BASE_URL=https://your-api-host
```

## Extension roadmap (already scaffolded by architecture)

- Replace seed repository with persistent DB adapters.
- Add ingestion pipeline services for scraping/live source updates.
- Add ML/NLP classification workers (e.g., Hugging Face models).
- Add embeddings and vector search service adapters.
- Add RAG query endpoints on top of insights + company corpus.
- Add scheduled refresh/score recomputation jobs.
- Deploy API as serverless functions or containerized microservice.
