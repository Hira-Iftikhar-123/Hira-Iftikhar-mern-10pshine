# Notes App (MERN + TypeScript)

This repository contains a full‑stack notes application with auth, rich editor, tags, search/filter, dark mode, unit tests, coverage, and SonarQube integration.

## Structure
```
backend/   # Express + TS + PostgreSQL (Mocha/Chai/Sinon)
frontend/  # React + Vite + TS (Jest + RTL)
sonar-project.properties
.github/workflows/sonar.yml
```

## Backend
```
cd backend
npm install
npm run dev          # starts API (creates tables if missing)
npm test             # unit tests
npm run test:cov     # coverage (c8 → backend/coverage)
```

## Frontend
```
cd frontend
npm install
npm run dev          # start app
npm run test         # unit tests + coverage (frontend/coverage)
```

## Features
- JWT auth, profile fetch
- Notes CRUD, title search, date filters (today/week/month/all), sort (created/updated/title, asc/desc)
- Rich editor, theme toggle, colorful tags, delete confirmations
- Structured logging via pino

## API (excerpt)
- GET `/api/notes?search=&sortBy=&sortOrder=&dateFilter=`
- POST `/api/notes` `{ title, content?, tags? }`
- PUT `/api/notes/:id` `{ title?, content?, tags? }`
- DELETE `/api/notes/:id`

## SonarQube / SonarCloud
Local:
1) Generate coverage (see above).
2) Ensure SonarQube and SonarScanner are running/installed.
3) From repo root: `sonar-scanner -Dsonar.login=YOUR_TOKEN`

CI:
- Add secrets `SONAR_HOST_URL`, `SONAR_TOKEN` and push; workflow runs tests + scan.

## Troubleshooting
- Jest DOM libs: `npm i -D @testing-library/dom` (frontend)
- Polyfills for TextEncoder/TextDecoder/matchMedia are set in `frontend/jest.setup.ts`.
- Mocha glob (Windows) handled in backend test script.
- TS test globals enabled via backend `tsconfig.json` types: `mocha`, `chai`.

## License
MIT


