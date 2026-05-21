# Privacy Debt Visualizer - Project Context

## Project Summary

Privacy Debt Visualizer is a Next.js web app that helps users estimate their digital privacy risk. Users sign up, answer a multi-section privacy behavior questionnaire, and receive a privacy debt score, risk breakdown charts, and AI-assisted recommendations.

The project is currently configured for Supabase PostgreSQL with a Node/Next.js backend. It is not being deployed to Vercel right now.

## Tech Stack

- Framework: Next.js 16 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS 4, shadcn-style components, Radix UI
- Charts: Recharts
- Icons: Lucide React
- Backend: Next.js API routes running on Node.js
- Database: Supabase PostgreSQL
- ORM: Prisma 5
- Authentication: Custom email/password auth with hashed passwords and signed httpOnly cookies
- AI: Vercel AI SDK with fallback rule-based recommendations
- ML Integration: Hybrid Next.js + Python FastAPI service for existing `.pkl` models
- Package manager: pnpm lockfile is present, but npm/npx also work locally

## Main Features

- User signup and login
- Server-side authentication using httpOnly cookies
- Privacy behavior simulator form
- Rule-based privacy score calculation
- AI-generated recommendations with local fallback logic
- PostgreSQL persistence for users and analyses
- Dashboard with score gauge, risk breakdown, platform exposure, data exposure, and recommendations
- Analysis history API for authenticated users

## Important Files and Folders

```text
app/
  layout.tsx                         Root layout and app providers
  page.tsx                           Landing/home page
  login/page.tsx                     Login screen
  signup/page.tsx                    Signup screen
  simulator/page.tsx                 Multi-section privacy questionnaire
  dashboard/page.tsx                 Results dashboard

app/api/
  analyze/route.ts                   Calculates score, generates recommendations, saves analysis
  analyses/route.ts                  Returns authenticated user's analysis history
  analyses/[id]/route.ts             Returns one authenticated user's analysis
  auth/signup/route.ts               Creates user and session
  auth/login/route.ts                Verifies user and creates session
  auth/logout/route.ts               Clears session cookie
  auth/me/route.ts                   Returns current authenticated user

components/
  simulator/                         Questionnaire section components
  dashboard/                         Dashboard chart and recommendation components
  ui/                                Shared UI components

lib/
  auth.ts                            Password hashing, cookie session helpers, current user lookup
  auth-context.tsx                   Client auth provider calling backend auth APIs
  db.ts                              Prisma client singleton
  score-engine.ts                    Rule-based privacy score calculation
  ai-service.ts                      AI recommendation generation
  api.ts                             Client API helper
  types.ts                           Shared TypeScript types
  utils.ts                           Shared utilities
  ml/                                TypeScript ML service client, feature extraction, fallback logic

prisma/
  schema.prisma                      PostgreSQL Prisma schema
  migrations/                        Database migrations

ml_service/
  main.py                            FastAPI ML service entrypoint
  model_registry.py                  Singleton pickle model loader and predictor
  feature_engineering.py             Python feature engineering for model inputs
  domain_risk.py                     Domain risk analysis helpers
  schemas.py                         Pydantic API schemas
  requirements.txt                   Python ML service dependencies

public/                              App icons and placeholder assets
styles/                              Global styles
package.json                         Scripts and dependencies
.env                                 Prisma Supabase DATABASE_URL and DIRECT_URL
.env.local                           Local app environment variables
.env.example                         Example environment configuration
```

## Database Models

### User

Stores registered users.

- `id`: unique user id
- `name`: user's display name
- `email`: unique login email
- `passwordHash`: hashed password
- `createdAt`: creation timestamp
- `updatedAt`: update timestamp
- `analyses`: related privacy analyses

### Analysis

Stores privacy analysis results for a user.

- `id`: unique analysis id
- `userId`: optional relation to a user
- `score`: JSON privacy score object
- `recommendations`: JSON recommendation object
- `formData`: JSON submitted questionnaire data
- `createdAt`: creation timestamp

## Authentication Flow

1. User submits signup or login form.
2. Frontend calls `/api/auth/signup` or `/api/auth/login`.
3. Backend hashes/verifies the password.
4. Backend creates a signed httpOnly cookie session.
5. Client auth context calls `/api/auth/me` to restore the logged-in user.
6. Protected pages redirect to `/login` if no user is available.
7. Logout calls `/api/auth/logout` and clears the session cookie.

Passwords are not stored in browser localStorage anymore.

## Analysis Flow

1. Logged-in user completes the simulator form.
2. Frontend posts form data to `/api/analyze`.
3. Backend checks the current authenticated user.
4. `lib/score-engine.ts` calculates the privacy score.
5. `lib/ai-service.ts` tries to generate AI recommendations.
6. If AI fails, the API uses fallback rule-based recommendations.
7. Analysis is saved in PostgreSQL through Prisma.
8. Dashboard loads the saved analysis by id from `/api/analyses/[id]`.

## Environment Variables

Required for Supabase PostgreSQL:

```text
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

Required for signed auth cookies:

```text
AUTH_SECRET="replace-this-with-a-long-random-secret"
```

Optional for AI recommendations:

```text
AI_GATEWAY_API_KEY=""
```

The app can still produce fallback recommendations if the AI key is missing or the AI request fails.

Optional for ML service integration:

```text
ML_SERVICE_URL="http://localhost:8001"
ML_MODELS_DIR="D:/TY/EDI/privacy_debt_models-20260520T150333Z-3-001/privacy_debt_models"
```

The Next.js backend can fall back to TypeScript scoring if the Python ML service is unavailable.

## Local Development Commands

Generate Prisma client:

```powershell
npm run db:generate
```

Apply database migrations to Supabase:

```powershell
npm run db:deploy
```

Start the app:

```powershell
npm run dev
```

Build the app:

```powershell
npm run build
```

Type-check:

```powershell
npx tsc --noEmit
```

Open Prisma Studio:

```powershell
npm run db:studio
```

Start the Python ML service after installing `ml_service/requirements.txt` into a Python environment:

```powershell
npm run ml:install
npm run ml:service
```

## Current Project Status

- PostgreSQL schema is defined.
- Supabase migrations have been applied with `npm run db:deploy`.
- Prisma client generation works.
- Backend auth API routes are implemented.
- Analyze and analysis retrieval routes are protected by backend session auth.
- Phase 1 ML service layer is scaffolded with a Python FastAPI boundary and TypeScript fallback client.
- Production build passes locally.
- Supabase must be reachable before full database-backed app testing.
- Vercel deployment is intentionally not part of the current work.

## Known Notes

- `npm run lint` currently fails because `eslint` is not installed, even though a lint script exists.
- `.env.local` contains local environment values and should not be committed.
- `.env` exists for Prisma CLI local database loading and is ignored by git.
- The app uses a custom auth implementation suitable for this project prototype. For production, consider adding stronger session management, rate limiting, CSRF strategy review, email verification, password reset, and deployment-grade secret handling.
