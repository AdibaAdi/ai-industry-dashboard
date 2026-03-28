# AI Industry Intelligence Dashboard

A production-minded AI company intelligence dashboard with a serverless-ready API layer, modular data services, and a frontend fully wired to backend data endpoints.

## Architecture

```text
backend/
  src/
    api/
      controllers/                   # Request handlers (companies/domains/insights/health)
      routes/                        # Route matching table
    data/
      companies.js                   # Canonical seed dataset (40+ companies)
      repositories/companyRepository.js
      connectors/databaseClient.js   # DB adapter scaffold
    services/
      companyService.js              # Query/filter/sort orchestration
      domainService.js
      insightsService.js
      scoringService.js
      pipeline/classificationService.js
      vector/vectorStoreService.js
      jobs/schedulerService.js
    utils/
      http.js                        # HTTP response + URL helpers
      companyQueryUtils.js           # Query parsing/filter/sort utilities
    types/companyTypes.js            # Shared JSDoc schemas
    app.js                           # HTTP app composition
    server.js                        # Runtime bootstrap

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

### 2) Configure frontend API URL

Create a frontend env file from the example:

```bash
cd frontend
cp .env.example .env
```

Set the API base URL in `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

Notes:
- The frontend API client reads `import.meta.env.VITE_API_BASE_URL` for all API requests.
- In local development (`npm run dev`), the client falls back to `http://localhost:4000` only when `VITE_API_BASE_URL` is not set.
- In non-dev builds, no localhost fallback is used, so deployments should always set `VITE_API_BASE_URL`.

### 3) Start frontend

```bash
cd frontend
npm run dev
```

## Extension roadmap (already scaffolded by architecture)

- Replace seed repository with persistent DB adapters.
- Add ingestion pipeline services for scraping/live source updates.
- Add ML/NLP classification workers (e.g., Hugging Face models).
- Add embeddings and vector search service adapters.
- Add RAG query endpoints on top of insights + company corpus.
- Add scheduled refresh/score recomputation jobs.
- Deploy API as serverless functions or containerized microservice.
