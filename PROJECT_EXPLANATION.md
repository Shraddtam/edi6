# Privacy Debt Visualizer - Project Explanation

## 1. Project Overview

Privacy Debt Visualizer is a full-stack privacy-risk analysis application. It helps users understand how their online behavior, account footprint, authentication habits, app permissions, data sharing, and website interactions contribute to their overall digital privacy risk.

The application collects structured privacy behavior data through a simulator form, analyzes the data using backend scoring logic and an ML service layer, generates personalized recommendations, stores the results in PostgreSQL through Prisma, and displays the final insights in a dashboard.

The project is designed as an academic/prototype privacy-risk system, but its architecture has been upgraded toward a production-style backend with real authentication, database persistence, and a modular ML integration path.

## 2. Project Objectives

The main objectives of the project are:

- Estimate a user's digital privacy risk from everyday online behavior.
- Replace purely static privacy advice with personalized, data-driven scoring.
- Help users identify high-risk behaviors such as password reuse, weak 2FA coverage, public profiles, excessive third-party app access, and risky website interaction.
- Store user accounts and analysis history securely in PostgreSQL.
- Provide a clean dashboard for visualizing privacy debt score, risk breakdown, platform exposure, data exposure, and recommendations.
- Integrate a trained ML pipeline without rewriting the existing Next.js application.
- Support explainable ML outputs such as feature contributions and SHAP-style explanations.
- Prepare the system for future dashboard upgrades such as domain-risk panels and ML explanation charts.

## 3. Core User Flow

1. The user opens the web app.
2. The user signs up or logs in using email and password.
3. The backend validates credentials and creates a signed httpOnly cookie session.
4. The user opens the simulator.
5. The simulator collects privacy-related information across multiple sections.
6. The frontend sends the completed form to `/api/analyze`.
7. The backend checks the authenticated user.
8. The backend calculates a privacy score.
9. The ML service layer can optionally call the Python ML service for model-based inference.
10. The backend generates recommendations using AI or fallback rule logic.
11. The analysis result is saved to Supabase PostgreSQL through Prisma.
12. The user is redirected to the dashboard.
13. The dashboard displays the score, charts, exposure summaries, and recommendations.
14. The user can later retrieve previous analysis history through authenticated APIs.

## 4. Main Functionalities

### Authentication

- User signup with name, email, and password.
- User login with email and password.
- Passwords are hashed before database storage.
- Sessions are stored using signed httpOnly cookies.
- Authenticated user is restored through `/api/auth/me`.
- Logout clears the session cookie.

### Privacy Simulator

The simulator collects user privacy behavior across these sections:

- Account footprint
- Authentication and security
- Data sharing behavior
- Third-party apps
- Privacy settings
- Website interaction
- Additional notes

### Privacy Risk Analysis

The backend analyzes user data and produces:

- Total privacy debt score
- Risk level
- Risk breakdown by category
- Platform exposure data
- Data exposure data
- Personalized recommendations

### ML Service Layer

The project includes a modular ML integration layer. It is designed to call a Python FastAPI service that loads trained `.pkl` models.

Current ML assets include:

- XGBoost privacy debt model
- Random Forest privacy debt model
- Domain risk models
- Domain classifier
- Metadata file
- SHAP summary and feature-importance images

The ML service layer supports:

- Model metadata loading
- Feature engineering
- ML prediction interface
- TypeScript fallback scoring
- Domain-risk scoring helpers
- SHAP-style feature contribution structure
- Future dashboard-ready ML JSON output

### Domain Risk Analysis

The domain-risk module is prepared to evaluate suspicious domains using:

- Domain length
- Hyphen count
- Digit ratio
- Suspicious TLD detection
- Entropy analysis
- Typosquatting checks
- Subdomain depth
- Privacy debt impact score

### Dashboard

The dashboard currently displays:

- Privacy debt score gauge
- Risk breakdown chart
- Platform exposure chart
- Data exposure chart
- AI-powered or fallback recommendations

It is ready to be extended with:

- ML feature contribution chart
- SHAP explanation panel
- Domain risk panel
- Protective factors panel
- Score explanation section

### Analysis History

Authenticated users can access saved analyses. The backend ensures users can only fetch their own analysis records.

## 5. Application Architecture

The project uses a hybrid architecture:

- Next.js handles the web app, API routes, authentication, and database persistence.
- Prisma connects the app to Supabase PostgreSQL.
- A Python FastAPI ML service handles trained pickle models.
- The TypeScript backend calls the ML service through a typed service layer.
- If the ML service is unavailable, the app can fall back to TypeScript scoring logic.

This avoids rewriting the app and avoids trying to load Python pickle models directly inside Node.js.

## 6. Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style UI components
- Radix UI primitives
- Lucide React icons
- Recharts for charts

### Backend

- Next.js API routes
- Node.js runtime
- Custom authentication helpers
- Signed httpOnly cookies
- Zod validation

### Database

- Supabase PostgreSQL
- Prisma ORM
- Prisma migrations

### ML and AI

- Python FastAPI ML service
- scikit-learn
- XGBoost
- SHAP
- pandas
- numpy
- joblib
- Vercel AI SDK for recommendation generation
- Rule-based fallback recommendations

### Tooling

- npm scripts
- Prisma CLI
- Python virtual environment
- PowerShell helper scripts for ML service setup

## 7. Important Files and Folders

```text
app/
  layout.tsx
  page.tsx
  login/page.tsx
  signup/page.tsx
  simulator/page.tsx
  dashboard/page.tsx

app/api/
  analyze/route.ts
  analyses/route.ts
  analyses/[id]/route.ts
  auth/signup/route.ts
  auth/login/route.ts
  auth/logout/route.ts
  auth/me/route.ts

components/
  simulator/
  dashboard/
  ui/

lib/
  auth.ts
  authorization.ts
  auth-context.tsx
  db.ts
  score-engine.ts
  ai-service.ts
  api.ts
  types.ts
  utils.ts

lib/ml/
  predictor.ts
  model-loader.ts
  feature-engineering.ts
  domain-risk.ts
  shap-utils.ts
  dashboard-json.ts
  types.ts

ml_service/
  main.py
  model_registry.py
  feature_engineering.py
  domain_risk.py
  schemas.py
  requirements.txt
  install.ps1
  run.ps1

prisma/
  schema.prisma
  migrations/

public/
  icons and placeholder assets

styles/
  global styles
```

## 8. Key Backend APIs

### Auth APIs

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Analysis APIs

```text
POST /api/analyze
GET  /api/analyses
GET  /api/analyses/[id]
```

### ML Service APIs

```text
GET  /health
POST /predict
```

The ML service runs separately on:

```text
http://localhost:8001
```

## 9. Database Models

### User

Stores registered users.

```text
id
name
email
passwordHash
createdAt
updatedAt
analyses
```

### Analysis

Stores privacy analysis results.

```text
id
userId
score
recommendations
formData
createdAt
```

Future ML persistence can extend this with:

```text
modelVersion
featureContributions
domainAnalysis
shapSummary
predictionMetadata
```

## 10. Authorization Model

The app uses server-side authorization checks for protected APIs.

The helper in `lib/authorization.ts` ensures that routes only continue when a valid authenticated user exists.

The analysis APIs do not trust client-provided user identifiers. They use the authenticated cookie session to determine the current user.

This protects:

- Analysis creation
- Analysis history retrieval
- Single analysis lookup

## 11. Environment Configuration

Required database variables:

```text
DATABASE_URL
DIRECT_URL
```

`DATABASE_URL` uses the Supabase pooler connection for runtime queries.

`DIRECT_URL` uses the direct Supabase database connection for Prisma migrations.

Required auth variable:

```text
AUTH_SECRET
```

Optional AI variable:

```text
AI_GATEWAY_API_KEY
```

Optional ML variables:

```text
ML_SERVICE_URL
ML_MODELS_DIR
```

Secrets should stay in `.env` or `.env.local` and should not be committed.

## 12. Commands

Install JavaScript dependencies:

```powershell
npm install
```

Generate Prisma client:

```powershell
npx prisma generate
```

Apply migrations to Supabase:

```powershell
npm run db:deploy
```

Start Next.js app:

```powershell
npm run dev
```

Create and activate Python virtual environment:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install ML dependencies:

```powershell
npm run ml:install
```

Start ML service:

```powershell
npm run ml:service
```

Build the app:

```powershell
npm run build
```

Type-check:

```powershell
npx tsc --noEmit
```

## 13. Current Project Status

- The frontend is working.
- Authentication is backend-backed.
- Passwords are hashed.
- Auth sessions use httpOnly cookies.
- Supabase PostgreSQL is configured.
- Prisma migration has been applied to Supabase.
- Existing dashboard and simulator are preserved.
- ML service layer has been scaffolded.
- Python ML service can load model metadata and expose health checks.
- Full ML scoring is being integrated incrementally.
- The app still has fallback scoring so it does not depend entirely on the ML service.

## 14. Future Improvements

Recommended next steps:

- Fully replace rule-based score calculation with ML prediction.
- Persist ML-specific output fields in the database.
- Add dashboard components for feature contributions and domain risk.
- Add a user-facing analysis history page.
- Add password reset and email verification.
- Add rate limiting to auth and analysis APIs.
- Add test coverage for auth, scoring, and ML service calls.
- Add production monitoring and structured logging.
- Add proper secret management for deployed environments.

## 15. One-Line Summary

Privacy Debt Visualizer is a full-stack AI and ML-assisted privacy-risk analysis platform that uses authenticated user sessions, Supabase PostgreSQL persistence, a Next.js dashboard, and a Python ML service layer to estimate and explain a user's digital privacy debt.
