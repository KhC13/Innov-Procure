# InnovProcure

InnovProcure connects public-sector challenges with startups through AI matching, applications, pilots, and procurement workflows.

## Development

Install dependencies with `npm install`, then run `npm run dev`. The Express server hosts the Vite frontend and API together during development.

Run `npm run build` to build the frontend and bundle the backend. Run `npm start` to serve the production build.

Configure runtime values in the root `.env` file using `.env.example` as a reference. PostgreSQL is configured with `DATABASE_URL`; the application currently uses its SQL database adapter and local PGlite fallback.

## Project Layout

- `frontend/` contains the Vite/React application.
- `backend/` contains the Express API, backend modules, and local upload destination.
- `prisma/` contains the Prisma schema.
- `data/postgres_db/` is local database data and is not application source.