# CLAUDE.md — web

React web portal for the School Management App — the tenant-facing client (one school per login), for roles **ADMIN**, **TEACHER**, **PARENT**. Talks entirely to a Spring Boot backend REST API (`/api/v1`) that's a multi-tenant SaaS platform under the hood. See `README.md` for local setup/run — this file is about how the code is organized and conventions worth knowing before changing it.

**Sibling repos** (same backend, different clients — not shared code, not in this repo): `school-management-app-backen` (the API), `school-management-app-android` (mobile, same tenant model), `school-management-app-operator` (internal platform-team console), `school-management-app-marketing` (public site). Backend DTOs are hand-mirrored here in `src/types/index.ts` with no shared schema/codegen — when a backend DTO changes, this file needs a manual update.

## Stack

React 18.3 + TypeScript 5.5 (strict), Vite 5.3, Tailwind CSS 3.4 (hand-built design-system primitives, no MUI/AntD), TanStack React Query 5.51, React Router DOM 6.24, axios 1.7, i18next/react-i18next (EN/HI), Leaflet/react-leaflet (bus map), Razorpay Checkout.js (loaded dynamically, not an npm dep), Vitest + React Testing Library for tests.

## This app also surfaces the school's subscription

Beyond the core school-admin features, this portal has an Account page (`/account`) covering: plan/entitlements (`{usage}/{limit}` for quota features), branding (logo upload, color pickers — entitlement-gated), billing (payment instructions, report-a-payment form, claim history — manual/offline billing, no payment gateway), data export (ZIP download, ADMIN), and billing-owner reassignment. A suspended/past-due/trial subscription drives blocking or dismissible UI (see below).

## Folder structure (`src/`)

- `api/` — one axios module per backend resource, plus `client.ts` (axios instance + interceptors) and `tokenStorage.ts`.
- `components/ui/` — `Button`, `Field`, `Card`, `Badge`, `States`, `Table`, `Pagination`, `Modal`, `PageHeader`.
- `components/layout/` — `AppShell`, `Sidebar`, `nav.ts` (role-filtered nav), `RequireAuth`, `RoleGuard`, `LanguageSwitcher`, plus subscription-awareness UI: `SuspendedScreen` (blocking, full-screen), `PastDueBanner` (dismissible), `TrialBanner` (dismissible, days remaining + upgrade CTA).
- `components/features/` — cross-page panels: `AttendancePanel`, `ExamResultsPanel`, `FeesPanel`, `HomeworkSubmissions`, `LibraryPanel`, `TransportPanel`, `BusMap`, `ClassSectionPicker`.
- `context/` — `AuthContext.tsx`, `SubscriptionContext.tsx` (ADMIN-only fetch of `/subscription`, drives the banners/screen above), `BrandingContext.tsx` (fetches for **every** role — the whole portal themes itself, not just admins).
- `lib/` — `format.ts`, `razorpay.ts` (dynamic Checkout.js loader).
- `i18n/` — i18next setup + `locales/{en,hi}.json`.
- `pages/` — one folder per feature area, plus `LoginPage`, `DashboardPage`, `NotFoundPage`, `account`.
- `types/index.ts` — every DTO, hand-mirrored from the backend.

## Routing (`App.tsx`, `RequireAuth` + `RoleGuard`)

Public: `/login`. Shared (backend enforces per-record access): `/dashboard`, `/students/:id`, `/timetable`, `/homework`, `/notices`, `/leave-requests`, `/events`, `/library`, `/account`. ADMIN+TEACHER: `/students`. TEACHER only: `/attendance`. PARENT only: `/children`. PARENT+TEACHER: `/messages`. ADMIN only: `/users`, `/notification-preferences`, `/analytics`, `/bus-routes`.

Role capability matrix: Students (Admin CRUD, Teacher view), Attendance (Teacher mark, Parent view own child), Timetable (Admin create, all view), Homework (Teacher post, all view), Exam results (Teacher record, all view), Notices (Admin post, all view), Fees (Admin view/update, Parent view own child), Users (Admin only), Branding (Admin view+edit, entitlement-gated), Billing (Admin view+edit, upgrade CTA billing-owner-gated), Data export (Admin download).

## API client (`src/api/client.ts`)

Base URL: `VITE_API_BASE_URL ?? 'http://localhost:8080'`, `/api/v1` appended. Request interceptor attaches `Authorization: Bearer <accessToken>` from `tokenStorage` (localStorage keys `sm.accessToken`, `sm.refreshToken`, `sm.role`). Response interceptor: on first 401 (excluding `/auth/refresh`/`/auth/login`), calls `POST /auth/refresh` once, **single-flight** — shares the in-flight promise across concurrent failed requests — retries, and on failure fires `sm:session-expired` + clears tokens. Also watches every response for `X-Subscription-Status: PAST_DUE` and `SUBSCRIPTION_SUSPENDED` 403s, feeding `SubscriptionContext`'s banner/blocking-screen state. `extractErrorMessage()` normalizes the backend's `ErrorResponse`.

## Auth flow

`AuthContext` owns `user`/`role`/`isAuthenticated`/`isBootstrapping`. `login()` → `POST /auth/login`, persist tokens, `GET /auth/me`, sync UI language. Boot restores session via `/auth/me` if a token exists. Listens for `sm:session-expired` to force logout. `RequireAuth`/`RoleGuard` are explicitly **UX-only** — the backend re-enforces via `@PreAuthorize`.

## Known gap

Fees screen's Pay button is not client-side gated by the `ONLINE_PAYMENTS` entitlement (server-side check still applies) — deferred, never revisited.

## Testing

Vitest + React Testing Library + jsdom (`vitest.config.ts`, `src/test/setup.ts`). `npm test` / `npm run test:watch`. 11 files / 85 tests covering `api/client.ts` (single-flight refresh, subscription-status watching), `tokenStorage`, `format`, `AuthContext`/`SubscriptionContext`, `RequireAuth`/`RoleGuard`, the three subscription-status banners/screen, `LoginPage`, `AccountPage`. Most feature pages/panels and the thin `api/*.ts` wrapper modules are not yet covered — mock the relevant `api/*.ts` module with `vi.mock` rather than adding MSW (established convention in this suite).
