# School Management — Web (React + TypeScript)

The web client for the School Management app. It is built entirely against the
Spring Boot backend REST API (`/api/v1`) documented in
[`../openapi.json`](../openapi.json). Supports the three roles **ADMIN**,
**TEACHER**, and **PARENT**, with role-based navigation and route guards.

## Tech stack

| Concern | Choice |
|---|---|
| Build tool | Vite 5 |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Server state | TanStack React Query 5 |
| Auth state | React Context (`AuthContext`) |
| Routing | React Router 6 |
| HTTP | axios (with JWT + refresh interceptor) |

## Prerequisites

- Node.js 20+ and npm 10+
- The backend running and reachable (default `http://localhost:8080`).
  See [`../backend/README.md`](../backend/README.md) to start Postgres and the API.

## Getting started

```bash
cd web
cp .env.example .env      # adjust VITE_API_BASE_URL if your backend is elsewhere
npm install
npm run dev               # http://localhost:5173
```

The backend's CORS config allows `http://localhost:5173` by default, so no proxy
is needed. If you run the web app on a different origin, update
`app.cors.allowed-origins` on the backend.

### Default dev login

The backend seeds a development admin (see `V2__seed_dev_admin.sql`):

- **Email:** `admin@school.app`
- **Password:** `Admin@123`

Use the admin to create teacher/parent accounts (**Users → Add user**) and
students, then link students to a parent so the parent portal has data.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check without emitting |

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the backend (no trailing slash). The client appends `/api/v1`. |

## Project structure

```
web/src/
├── api/            # axios client + JWT/refresh interceptor, one module per feature
├── components/
│   ├── ui/         # design-system primitives (Button, Field, Table, Modal, …)
│   ├── layout/     # AppShell, Sidebar, RequireAuth, RoleGuard, nav config
│   └── features/   # cross-page feature panels (attendance, results, fees, class picker)
├── context/        # AuthContext (login/logout, session bootstrap)
├── lib/            # formatting helpers + enum option lists
├── pages/          # one folder per feature area, plus LoginPage/DashboardPage
├── types/          # hand-mirrored backend DTOs (kept in sync with openapi.json)
├── App.tsx         # route tree with role guards
└── main.tsx        # providers: QueryClient, Router, AuthProvider
```

## How auth works

1. `POST /auth/login` returns `{ accessToken, refreshToken, role }`, persisted in
   `localStorage`.
2. Every request carries `Authorization: Bearer <accessToken>` via an axios
   request interceptor.
3. On a `401`, the response interceptor transparently calls `POST /auth/refresh`
   once (single-flight) and retries the original request. If refresh fails, the
   session is cleared and the app redirects to `/login`.
4. `RequireAuth` gates the authenticated area; `RoleGuard` restricts routes to
   specific roles. The backend re-checks every rule with `@PreAuthorize`, so the
   guards are UX only — not the security boundary.

## Role capabilities

| Area | ADMIN | TEACHER | PARENT |
|---|---|---|---|
| Students directory | view + create + edit | view | — |
| My children | — | — | view own children |
| Student profile | ✓ (+edit) | ✓ | own child |
| Attendance | — | mark + view | view own child |
| Timetable | view + create | view | view |
| Homework | view | post + view | view |
| Exam results | — | record + view | view own child |
| Notices | post + view | view | view |
| Fees | view + update | — | view own child |
| Users | manage | — | — |

> The parent flow relies on `GET /api/v1/students/my-children`, which returns the
> authenticated parent's linked children.
