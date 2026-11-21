# InnovProcure — AI Models, Agents & API Disclosure

## 1. AI Models & Development Tools

| Model / Tool | Usage |
|---|---|
| Google Gemini 2.5 Flash | AI-based startup–problem matching |
| Google AI Studio | AI prototyping and code generation |
| GitHub Copilot | AI-assisted coding in VS Code; exact model unverified |
| Claude | Research, technical assistance, and development support |


## 2. AI Integration

- **SDK:** `@google/genai`
- **Model:** `gemini-2.5-flash`
- **AI Function:** `matchProblemAndStartup()`
- **File:** `backend/src/ai/matcher.ts`
- **Endpoint:** `POST /api/matches/generate`
- **API Key:** `GEMINI_API_KEY`

The backend uses Gemini for startup–problem matching when the API key is configured. Otherwise, it falls back to deterministic matching logic.

## 3. Agents & Automation

InnovProcure follows an AI-assisted evaluation workflow covering startup–problem matching, proposal evaluation, weighted scoring, shortlisting, pilot tracking, and milestone monitoring.

**Important:** No custom autonomous agents, tool-calling workflow, or dedicated AI agent framework has been verified. These workflows should not be described as autonomous AI agents.

## 4. Environment Variables & API Configuration

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API authentication |
| `DATABASE_URL` | Database connection |
| `JWT_SECRET` | JWT token signing secret |
| `JWT_EXPIRES_IN` | Token expiration configuration |
| `PORT` | Backend server port |
| `NODE_ENV` | Runtime environment |
| `CORS_ORIGINS` | Allowed frontend origins |
| `STORAGE_PROVIDER` | File storage provider configuration |
| `UPLOAD_DIR` | Upload directory configuration |
| `DISABLE_HMR` | Hot Module Replacement configuration |

**API key values and secrets are intentionally excluded.** Actual configured values should remain in environment variables and must never be published in source code or documentation.

## 5. Backend & Platform APIs

- **Authentication:** Registration, login, JWT authentication, and role-based access control.
- **Startup & Challenge APIs:** Startup registration, challenge creation, and proposal submissions.
- **Matching & Evaluation APIs:** Startup–problem matching, eligibility checks, weighted scoring, and shortlisting.
- **Procurement Workflow:** Pilot management, KPIs, milestones, timelines, and payment stages.
- **Dashboard & Notifications:** Progress tracking and workflow updates.
- **Database Integration:** Persistent storage through the configured database connection.

## 6. Security & Human Oversight

- Environment variables protect credentials and configuration.
- JWT authentication and RBAC control access.
- Evaluation criteria and weighted scores support structured decision-making.
- AI assists matching and evaluation; authorized stakeholders remain responsible for procurement decisions.
- Fallback matching logic allows the matching endpoint to operate without Gemini when the API key is unavailable.
