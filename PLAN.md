# Psy-Engine — Phase Development Plan

> **Project**: Nuxt 3 Fullstack — Psychology Test Management (Recruitment/Career Focus)
> **Repo**: `/home/mbx/.openclaw/workspace/psy-engine/`
> **Dev URL**: http://10.50.30.35:3000
> **Tunnel**: https://psy.yumalab.my.id/
> **DB**: PostgreSQL 17 — `psy_engine` (mbx@127.0.0.1)
> **Last Updated**: 2026-07-27 — Acceptance Criteria below now reflect actually-verified state, not aspirational placeholders. See inline notes for any deliberate scope cuts. Note: each phase's "Files Affected" listing is left as the original planning artifact and may not match actual file names/locations 1:1 (e.g. routing uses `/take/[token]` throughout rather than mixed `/take`/`/t` paths, and some composables were implemented as inline page logic instead of standalone files) — treat Acceptance Criteria as the authoritative done/not-done signal, not the file lists.

---

## Overview

| Phase | Focus | Effort | Dependencies |
|-------|-------|--------|-------------|
| **0** | Settings (Profile, Password, App Config) | ~8h | None |
| **1** | CRUD API + Admin Pages (Test Types, Participants, Sessions) | ~24h | None (current stack) |
| **2** | Public Test Runner Page (Dynamic Question Rendering) | ~20h | Phase 1 session APIs |
| **3** | Invitation System + Session Lifecycle | ~16h | Phase 1–2 |
| **4** | Results/Reports + Dashboard Polish | ~16h | Phase 2–3 |
| **5** | Error Handling, Loading States, Toasts, UI Polish | ~12h | Phases 1–4 |
| **6** | Production Hardening, Admin UX, Edge Cases | ~12h | All prior phases |

**Total Estimated Effort**: ~108h

---

## Phase 0 — Settings & User Profile

### Goal
Build settings pages: user profile management, password change, and app-wide configuration.

### Tasks

1. **User Profile API**
   - `GET /api/auth/profile` — get current user profile
   - `PUT /api/auth/profile` — update name, email
   - `PUT /api/auth/password` — change password (requires current password)

2. **Profile Page**
   - Display current user info (name, email, role)
   - Edit form for name/email
   - Change password form

3. **App Settings Page** (admin-only)
   - Basic system config (app name, description)
   - Toggle dark mode preference (persist to user profile)

4. **Update Admin Layout**
   - Add Settings link to sidebar navigation
   - Active state highlight

### Files Affected
- `server/api/auth/profile.get.ts` — new
- `server/api/auth/profile.put.ts` — new
- `server/api/auth/password.put.ts` — new
- `pages/settings/index.vue` — new
- `layouts/default.vue` — add settings nav item
- `db/schema/users.ts` — maybe add preferences JSONB column

### Acceptance Criteria
- [x] User can view & edit their name/email
- [x] User can change password
- [ ] Admin can access an app-wide config page (app name, description, dark-mode toggle) — **not built**; Settings currently only has Profile/Security/Users/Roles & Permissions tabs, no system-config tab
- [x] Settings nav item appears & highlights
- [x] Password change validates current password

### Risks
- Forgot to validate current password before updating
- Settings page accessible to non-admin users

### Effort
~8h

---

## Phase 1 — CRUD API & Admin Pages

### Goal
Build complete CRUD API endpoints for test_types, participants, and sessions, plus admin management pages for each entity.

### Tasks

1. **Participants CRUD API**
   - `GET /api/participants` — list with search/filter (name, email, NIK)
   - `POST /api/participants` — create participant
   - `GET /api/participants/[id]` — detail
   - `PUT /api/participants/[id]` — update
   - `DELETE /api/participants/[id]` — soft-delete or hard-delete

2. **Test Types CRUD Admin API** (protected, admin-only)
   - `GET /api/admin/test-types` — list all (including inactive)
   - `POST /api/admin/test-types` — create test type (JSONB config, questions, scoring_config)
   - `GET /api/admin/test-types/[id]` — detail with full config
   - `PUT /api/admin/test-types/[id]` — update (partial JSONB merge)
   - `DELETE /api/admin/test-types/[id]` — deactivate (set `isActive = false`)

3. **Sessions CRUD API**
   - `GET /api/sessions` — list with filters (status, test_type, participant, date range)
   - `POST /api/sessions` — create session (auto-generate token, requires test_type_id + participant_id)
   - `GET /api/sessions/[id]` — detail with answers, scores, interpretation
   - `PATCH /api/sessions/[id]/status` — update status (abandon, verify)
   - `DELETE /api/sessions/[id]` — only if status is `pending`

4. **Session Logs API** (read-only for admin)
   - `GET /api/sessions/[id]/logs` — paginated event logs for a session

5. **Admin Pages — Participants CRUD**
   - List page with search bar (name/email/NIK)
   - Create form modal/page (name, birth date, gender, phone, email, NIK)
   - Edit form (prefilled, same as create)
   - Delete confirmation dialog

6. **Admin Pages — Test Types Create/Edit**
   - Create page with dynamic form sections:
     - Basic info (name, slug, type, description)
     - Config (timeLimit, allowSkip, randomize, questionsPerPage, instructions)
     - Questions builder (add/edit/reorder questions, options with weights/dimensions/pairs)
     - Scoring config (algorithm selector, dimension definitions, interpretation ranges)
   - Edit page (load existing data into same form)
   - Slug auto-generation from name (editable)

7. **Admin Pages — Sessions Management**
   - Tabs: Active / Completed / All
   - Filters: test type, participant, date range
   - Detail view: participant info, answers table, scores, interpretation
   - Action buttons: Invite (copy link), Verify, Abandon
   - Create session flow: select test type → select participant → create → show invite link

8. **Update Server Auth Middleware**
   - Add admin role check for `/api/admin/*` endpoints
   - Ensure public paths remain accessible

### Files Affected

```
NEW:
  server/api/participants/index.get.ts
  server/api/participants/index.post.ts
  server/api/participants/[id].get.ts
  server/api/participants/[id].put.ts
  server/api/participants/[id].delete.ts
  server/api/admin/test-types/index.get.ts
  server/api/admin/test-types/index.post.ts
  server/api/admin/test-types/[id].get.ts
  server/api/admin/test-types/[id].put.ts
  server/api/admin/test-types/[id].delete.ts
  server/api/sessions/index.get.ts
  server/api/sessions/index.post.ts
  server/api/sessions/[id].get.ts
  server/api/sessions/[id]/status.patch.ts
  server/api/sessions/[id]/delete.delete.ts
  server/api/sessions/[id]/logs.get.ts
  pages/admin/test-types/create.vue
  pages/admin/test-types/[slug]/edit.vue
  pages/admin/participants/create.vue
  pages/admin/participants/[id]/edit.vue
  pages/admin/sessions/[id].vue
  components/admin/ParticipantForm.vue
  components/admin/TestTypeForm.vue
  components/admin/QuestionBuilder.vue
  components/admin/SessionDetail.vue

MODIFIED:
  server/middleware/auth.ts       (add admin-role guard)
  pages/admin/test-types.vue     (wire to real API, add search)
  pages/admin/participants.vue   (wire to real API, add search)
  pages/admin/sessions.vue       (wire to real API, add create button)
  pages/index.vue                (wire stats to real API counts)
```

### Acceptance Criteria

- [x] Can create, read, update, delete participants via API and UI
- [x] Can create, read, update, deactivate test types via API and UI — **scope cut**: create/edit UI uses raw JSON textareas for `config`/`questions`/`scoringConfig` (client-validated), not the visual question-builder originally envisioned. Fully functional for JSON-comfortable admins.
- [x] Can create sessions (with auto-generated tokens) via API and UI
- [x] Sessions list shows real data with filtering
- [x] Admin-only endpoints are protected (non-admin gets 403)
- [x] Public `/api/tests` endpoints still work without auth

### Risks

- JSONB structure for test_types questions/config changes could break seed data or existing tests — need migration strategy or backward-compatible defaults
- Slug uniqueness collision if name-based generation conflicts
- Large question sets could make the admin form slow — consider pagination or chunked save

### Effort

| Component | Est. (h) |
|-----------|----------|
| Participants CRUD API | 3 |
| Test Types Admin API | 4 |
| Sessions CRUD API | 3 |
| Session Logs API | 1 |
| Participants admin pages | 3 |
| Test Types create/edit pages | 5 |
| Sessions admin pages | 3 |
| Auth middleware updates | 1 |
| Dashboard stats wiring | 1 |
| **Total** | **~24h** |

---

## Phase 2 — Public Test Runner Page

### Goal
Build a public, dynamic test runner page that renders any test type from the DB JSON definition, handles pagination, timing, and submission.

### Tasks

1. **Invitation/Landing Page** — `/take/[token]`
   - Validate session token — redirect to 404 if invalid or expired
   - Show test info (name, description, time limit, instructions)
   - Participant name confirmation
   - "Start Test" button (changes session status to `in_progress`)

2. **Dynamic Question Renderer Component**
   - Render questions based on `questions` JSONB array structure
   - Support question types via rendering strategies:
     - **Single choice**: radio buttons (correct_count, dimension_sum, paired_choice)
     - **Likert scale**: 1–5 radio buttons with labels
     - **Paired choice**: A/B selection cards
   - Handle `subtestKey` grouping
   - Show question number / total

3. **Pagination & Navigation**
   - `questionsPerPage` from config — render N questions per page
   - Previous / Next buttons
   - Progress bar (X of N answered)
   - Jump-to-question index (optional)
   - Timer display & auto-submit on expiry (configurable via `timeLimit`)

4. **Subtests Support** (from `config.subtests`)
   - If test has subtests (e.g., CFIT with timed sub-parts):
     - Show subtest intro + instructions before each subtest
     - Subtest-specific timer
     - Auto-advance to next subtest on time expiry
     - Store answers per subtest

5. **Answer Persistence (Auto-Save)**
   - Save answers to session row via `PATCH /api/sessions/[id]/answers`
   - Debounced auto-save every 30s or on page change
   - On browser refresh — restore previously saved answers

6. **Submit Flow**
   - "Submit" button on final page (with confirmation dialog)
   - POST to `/api/tests/[slug]/submit` (existing endpoint)
   - On success: redirect to result/thank-you page

7. **API: Update Session Answers**
   - `PATCH /api/sessions/[id]/answers` — save partial answers
   - `PATCH /api/sessions/[id]/start` — update status to `in_progress`, set `startedAt`

8. **Thank-You / Completion Page** — `/take/[token]/complete`
   - Simple page: "Test submitted successfully"
   - Option to show result (if test type allows immediate feedback)
   - Option to redirect to external URL (recruitment portal)

### Files Affected

```
NEW:
  pages/take/[token].vue                 (invitation landing + runner entry)
  pages/take/[token]/complete.vue        (completion page)
  composables/useTestRunner.ts           (runner state, timer, auto-save)
  composables/useTimer.ts                (countdown timer composable)
  components/test-runner/QuestionRenderer.vue
  components/test-runner/QuestionSingleChoice.vue
  components/test-runner/QuestionLikert.vue
  components/test-runner/QuestionPairedChoice.vue
  components/test-runner/ProgressBar.vue
  components/test-runner/TimerBar.vue
  components/test-runner/SubtestIntro.vue
  server/api/sessions/[id]/answers.patch.ts
  server/api/sessions/[id]/start.patch.ts

MODIFIED:
  server/middleware/auth.ts               (add /take/* to public paths if needed)
  nuxt.config.ts                          (maybe add route rules or nitro config)
```

### Acceptance Criteria

- [x] `/take/[token]` loads test info, participant confirmation, and instructions
- [x] Questions render dynamically from DB JSONB for all 4 algorithm types
- [ ] Pagination per `questionsPerPage` config — **not implemented**; renderer always shows one question at a time regardless of the config value
- [x] Timer counts down and auto-submits on expiry (single global timer, resumes correctly across page refresh using `startedAt` + elapsed time)
- [ ] Subtests (CFIT) timed sections — **partial**: subtest label displays as a cosmetic header, but there is no per-subtest timer or auto-advance; only one test-wide timer exists
- [x] Auto-save persists answers — refresh restores them (debounced 30s + on submit, verified via session `answers` jsonb)
- [x] Submission completes the session and calculates scores (verified live for all 4 scoring algorithms)

### Risks

- Timer accuracy in background tabs — use `document.visibilitychange` to pause/resume
- Large question sets (>100) could cause render lag — consider virtual scrolling or chunked loading
- Auto-save race conditions if multiple tabs open — use session token as single source of truth

### Effort

| Component | Est. (h) |
|-----------|----------|
| Invitation landing page | 2 |
| Question renderer components | 5 |
| Pagination & navigation | 2 |
| Subtests support | 3 |
| Timer system | 2 |
| Auto-save & answer persistence | 3 |
| Submit flow | 1 |
| API patches (answers/start) | 2 |
| **Total** | **~20h** |

---

## Phase 3 — Invitation System & Session Lifecycle

### Goal
Build an invitation system to generate unique test links for participants, manage the full session lifecycle, and track progress.

### Tasks

1. **Invitation Generation**
   - Generate unique token (UUID or crypto random string) per session
   - Compose invitation URL: `https://psy.yumalab.my.id/take/[token]`
   - Store token in `sessions.token`
   - Allow admin to re-generate invitation link

2. **Invitation Sharing**
   - Admin page: "Copy Invitation Link" button (copies to clipboard)
   - Admin page: "Send Invitation" button (mailto link, or placeholder for email integration)
   - QR code generation for invitation link (optional, low priority)

3. **Session Lifecycle Management**
   - `pending` → admin creates session, no test taken yet
   - `in_progress` → participant clicks "Start Test"
   - `completed` → participant submits all answers
   - `verified` → admin reviews and verifies scores
   - `abandoned` → participant didn't complete (auto-detect via inactivity timeout)

4. **Inactivity Detection**
   - Background job or on-access check:
     - If `status === 'in_progress'` AND `lastActivity > 24h` → auto-abandon
     - Log abandonment to session_logs

5. **Session Verification Flow**
   - Admin opens session detail
   - Reviews answers and auto-calculated scores
   - Can adjust interpretation notes
   - Click "Verify" → status becomes `verified`, set `verifiedAt` + `verifiedBy`

6. **Session Logging**
   - Log events: session_created, test_started, answer_saved, test_completed, session_abandoned, session_verified
   - Store metadata (browser, IP, timestamp) when available
   - Admin view: timeline of events for a session

### Files Affected

```
NEW:
  server/api/sessions/[id]/verify.patch.ts
  components/admin/InvitationLink.vue
  components/admin/SessionTimeline.vue
  utils/invitation.ts                     (token generation, URL composition)

MODIFIED:
  pages/admin/sessions/[id].vue           (add verify, timeline, invite link)
  server/api/sessions/index.post.ts       (generate token on create)
  server/utils/scoring.ts                  (maybe add verification helpers)
```

### Acceptance Criteria

- [x] Every session gets a unique token on creation
- [x] Invitation URL is displayed and copyable
- [x] Session lifecycle transitions are enforced (no illegal state changes)
- [x] Inactive sessions are auto-abandoned
- [x] Admin can verify sessions with notes
- [x] Session event log is visible as a timeline

### Risks

- Token collision risk is negligible with UUID but worth checking at insert time
- Auto-abandon could mistakenly abandon a slow participant — use generous timeout (≥24h)
- Email integration is out of scope — "send invitation" is clipboard/mailto only

### Effort

| Component | Est. (h) |
|-----------|----------|
| Invitation generation & token system | 2 |
| Invitation link UI components | 2 |
| Session lifecycle state machine | 3 |
| Inactivity detection | 2 |
| Verification flow | 3 |
| Session logging & timeline | 3 |
| **Total** | **~16h** |

---

## Phase 4 — Results & Reports

### Goal
Build result/report views for completed sessions — both admin-facing (detailed) and participant-facing (summary).

### Tasks

1. **Admin Report View** — `/admin/sessions/[id]/report`
   - Participant info card (name, age, gender)
   - Test info (type, date taken, duration)
   - Scores table: dimension → raw score → normalized score → interpretation label
   - Answers review: question-by-question with correct/incorrect indicators (for aptitude)
   - Radar/spider chart for multi-dimension tests (EPPS, PAPI)
   - Download/Print report button (print CSS or PDF generation)

2. **Participant Result View** — `/take/[token]/result`
   - If session is `completed` or `verified`
   - Summary scores by dimension
   - Simple bar chart or table
   - Interpretation text per dimension
   - "Print" or "Download PDF" option

3. **Report Charts (Radar + Bar)**
   - Lightweight chart component (no heavy library — use SVG or canvas)
   - Radar chart for multi-dimension (PAPI Kostick has ~20 dimensions)
   - Bar chart for single-score tests (CFIT)
   - Color-coded by interpretation range (low/medium/high)

4. **Session Comparison (Admin)**
   - Compare scores across multiple sessions for same participant
   - Compare scores across participants for same test type
   - Simple table view with avg/median/min/max

5. **Export**
   - CSV export for sessions list (admin)
   - CSV/JSON export for individual session results
   - Bulk export (all completed sessions in date range)

### Files Affected

```
NEW:
  pages/admin/sessions/[id]/report.vue
  pages/take/[token]/result.vue
  components/reports/ScoreTable.vue
  components/reports/RadarChart.vue           (SVG-based)
  components/reports/BarChart.vue              (SVG-based)
  components/reports/AnswersReview.vue
  components/reports/InterpretationCard.vue
  components/reports/ComparisonTable.vue
  server/api/sessions/export.get.ts           (CSV/JSON export)
  server/api/sessions/compare.get.ts          (comparison data)

MODIFIED:
  pages/take/[token]/complete.vue              (link to result page)
  pages/admin/sessions/[id].vue                (link to report)
```

### Acceptance Criteria

- [x] Admin can view detailed report per session with scores, interpretation, answers
- [x] Radar chart renders for multi-dimension tests
- [x] Participant can view their result after completion
- [x] Print/export works (print CSS, CSV download)
- [x] Session comparison is available for admin
- [x] Bulk export works for date-range queries

### Risks

- SVG radar chart with 20+ dimensions could be cluttered — consider grouping or filtering visible dimensions
- PDF generation is complex — start with Print CSS (browser print-to-PDF) before integrating a library like puppeteer
- Large answer sets could make answers-review page slow — use pagination there

### Effort

| Component | Est. (h) |
|-----------|----------|
| Admin report page | 3 |
| Participant result page | 2 |
| Radar chart (SVG) | 4 |
| Bar chart (SVG) | 2 |
| Score tables & interpretation cards | 2 |
| Answers review | 2 |
| Session comparison | 1 |
| Export (CSV/JSON) | 2 |
| **Total** | **~16h** |

---

## Phase 5 — Error Handling, Loading States, Toasts & UI Polish

### Goal
Implement consistent error handling, loading indicators, toast notifications, and UI polish across all pages.

### Tasks

1. **Toast Notification System**
   - Install/integrate `vue-sonner` or build a simple toast composable using `reka-ui` toast
   - Show notifications for: login success/error, CRUD operations, submission, errors
   - Auto-dismiss after 5s
   - Toast variants: success, error, warning, info

2. **Loading States**
   - Skeleton loaders for data tables (use shadcn-vue Skeleton or custom)
   - Loading spinner on buttons during async operations
   - Full-page loading overlay for route transitions (Nuxt `pageLoading` integration)
   - Suspense-aware loading for async components

3. **Error Handling — Global**
   - Nuxt error page (`error.vue`) for 404, 500, etc.
   - Global fetch error interceptor — show toast on network errors
   - Form validation errors displayed inline below fields
   - API error normalization — consistent error shape from all endpoints

4. **Error Handling — Per-Page**
   - Empty state illustrations/messages for lists with no data
   - Retry button on fetch failure
   - Graceful degradation when optional data is missing (e.g., no interpretation config)

5. **UI Polish**
   - Responsive table improvements (horizontal scroll hints, sticky headers)
   - Focus management in forms (auto-focus first field)
   - Keyboard navigation support
   - Consistent spacing, typography, and color usage
   - Page transition animations (Nuxt `pageTransition`)

6. **Confirm Dialogs**
   - Delete confirmation dialog for all destructive actions (reuse `UiDialog`)
   - "Unsaved changes" warning when navigating away from create/edit forms

### Files Affected

```
NEW:
  error.vue                                 (Nuxt global error page)
  components/ui/skeleton/                   (if not already present)
  composables/useToast.ts                   (toast composable)
  composables/useConfirm.ts                 (confirmation dialog composable)
  plugins/api-error-handler.ts              (global fetch interceptor)
  components/global/EmptyState.vue
  components/global/LoadingSkeleton.vue

MODIFIED:
  app/app.vue                               (add Toast provider)
  layouts/default.vue                       (add toast area)
  layouts/login.vue                         (add toast area)
  pages/*.vue                               (add loading, toasts, error states)
  pages/admin/*.vue                         (add confirm dialogs for deletes)
  server/middleware/auth.ts                  (ensure consistent error shapes)
```

### Acceptance Criteria

- [x] Toast notifications appear on all CRUD operations and errors — `vue-sonner`, layered additively on top of existing inline error/success text (not a replacement — see note below)
- [x] Loading skeletons show during data fetch — `components/ui/skeleton/` on participants/sessions list loading states
- [x] Error page handles 404/500 gracefully — root `error.vue`, styled consistently, routes back to `/` or `/login` based on auth state
- [x] Network errors show user-friendly messages — via toasts on fetch failures
- [x] Delete operations require confirmation — `composables/useConfirm.js` + `components/global/ConfirmDialog.vue` (`UiDialog`-based, replacing the earlier native `confirm()` calls on role/test-type/participant/session destructive actions)
- [~] Forms show inline validation errors — **partial**: field-adjacent errors (e.g. password mismatch, dialog-level create validation) still show as inline text as before; server-side Zod validation (Phase 6) is surfaced as a generic error/toast message, not per-field highlighting tied to individual inputs
- [x] Empty states are informative (not blank tables) — `components/global/EmptyState.vue` via `UiResponsiveTable`'s `#empty` slot on participants/test-types/sessions list pages

_Note: toasts were layered on top of, not swapped in for, the existing inline error/success refs — deliberate, lower-risk than rewriting 5+ already-working page templates. Both now coexist by design._

### Risks

- Over-engineering loading states — skeleton loaders for simple pages add complexity for marginal UX gain
- Toast library dependency could conflict with existing reka-ui components — use `vue-sonner` (lightweight, dedicated toast)
- Global error interceptors might interfere with form validation — ensure only network/500 errors are global

### Effort

| Component | Est. (h) |
|-----------|----------|
| Toast system integration | 2 |
| Loading states & skeletons | 2 |
| Global error handling | 2 |
| Per-page error/empty states | 2 |
| Confirm dialogs | 1 |
| UI polish pass | 2 |
| **Total** | **~12h** |

---

## Phase 6 — Production Hardening & Admin UX

### Goal
Harden the application for production use: security, performance, admin UX improvements, and edge case handling.

### Tasks

1. **Security Hardening**
   - Move JWT secret to environment variable (already wired, ensure `.env` is in `.gitignore`)
   - Rate limiting on auth endpoints (login, register) — prevent brute force
   - Input sanitization on all API inputs
   - XSS protection: ensure rendered question text/options are sanitized
   - Helmet/CORS headers on Nitro server
   - Audit: ensure no sensitive data leaked in API responses (e.g., password hashes)

2. **Input Validation**
   - Zod schemas for all API request bodies
   - Validate JSONB structure against expected shape before DB insert
   - Validate session transitions (can't go from `pending` to `verified` directly)
   - Test type slug validation (alphanumeric + hyphens only)

3. **Performance Optimizations**
   - Indexed DB queries (add indexes on `sessions.token`, `sessions.status`, `sessions.test_type_id`, `sessions.participant_id`)
   - Pagination for all list endpoints (limit/offset or cursor-based)
   - N+1 query audit — eager-load relations (session → test_type, session → participant)
   - Server-side caching for test type definitions (short TTL, bust on update)

4. **Admin UX Improvements**
   - Bulk import participants (CSV upload)
   - Bulk create sessions (select multiple participants for same test type)
   - Dashboard redesign with real stats and charts
   - Search autocomplete for participants/test types
   - Saved filter presets for sessions view

5. **Data Integrity**
   - Cascade deletes: if test type is deactivated, what happens to existing sessions?
     - Option: sessions keep a snapshot of the test config at creation time
     - Option: soft-deactivate only, existing sessions remain valid
   - Archive old sessions (status `completed` > 1 year ago)
   - Database backup strategy documented

6. **Testing**
   - API endpoint tests (happy path + error cases)
   - Critical flow E2E: create participant → create session → take test → view results
   - Edge cases: expired token, abandoned session, concurrent submissions

7. **Documentation**
   - API documentation (auto-generated via Nitro OpenAPI)
   - Admin user guide
   - Deployment notes (environment variables, DB setup, backup)

### Files Affected

```
NEW:
  server/utils/validation.ts             (Zod schemas)
  server/middleware/rate-limit.ts         (rate limiting)
  server/api/participants/import.post.ts (CSV upload)
  server/api/admin/bulk-sessions.post.ts (bulk create)
  components/admin/BulkImportDialog.vue
  utils/db-indexes.sql                   (migration file for indexes)

MODIFIED:
  nuxt.config.ts                          (add CORS/Helmet config, rate limit settings)
  server/middleware/auth.ts               (add rate limiting reference, input validation)
  pages/index.vue                         (dashboard redesign)
  server/api/tests/[slug].get.ts          (add cache headers)
  pages/admin/participants.vue            (add bulk import)
  pages/admin/sessions.vue                (bulk create, saved filters)
  db/schema/sessions.ts                   (add snapshot column if needed)
  .env.example                            (document all variables)
  .gitignore                              (ensure .env listed)
```

### Acceptance Criteria

- [x] Auth endpoints are rate-limited — in-memory fixed-window limiter (login 10/15min, register 5/hour per IP); documented single-instance limitation, would need a shared store (Redis) behind a load balancer
- [x] All API inputs are validated with Zod — `server/utils/validation.js`, wired into all mutating endpoints, replacing hand-rolled checks
- [x] DB has indexes on query-heavy columns — `sessions(status, test_type_id, participant_id, created_at)`, `participants(email, nik)`
- [ ] List endpoints are paginated — **deliberate scope cut**: at this app's current data scale, enforced pagination risks silently truncating existing list pages without coordinated frontend changes; revisit if/when real data volume grows
- [x] Bulk participant import works (CSV)
- [x] Bulk session creation works
- [x] Dashboard shows real stats with charts
- [ ] API documentation is accessible (OpenAPI UI) — not yet attempted; `nitro.experimental.openAPI: true` is set but no browsable docs UI (Scalar/Swagger) is wired up
- [x] Not a single password hash or token leaks in any response — verified: every endpoint touching `passwordHash` explicitly projects it out of responses

### Risks

- CSV import format needs careful specification — provide template download
- Rate limiting could block legitimate bulk operations — whitelist admin IPs
- Database migration for indexes requires downtime on large tables (but at current scale, negligible)
- Zod schemas for JSONB need to match frontend expectations exactly — keep in sync

### Effort

| Component | Est. (h) |
|-----------|----------|
| Security hardening | 2 |
| Input validation (Zod) | 2 |
| Performance & indexes | 2 |
| Bulk import/export | 2 |
| Bulk session creation | 1 |
| Dashboard redesign | 1 |
| Data integrity measures | 1 |
| Testing | 2 |
| Documentation | 1 |
| **Total** | **~12h** |

---

## Appendix: File Structure Reference

```
psy-engine/
├── app/app.vue                    # Root component (NuxtLayout + NuxtPage)
├── assets/css/main.css            # Tailwind base styles
├── components/
│   ├── admin/
│   │   ├── InvitationLink.vue     # Copy/send invitation
│   │   ├── ParticipantForm.vue    # Create/edit participant form
│   │   ├── QuestionBuilder.vue    # Dynamic question set builder
│   │   ├── SessionDetail.vue      # Session detail card
│   │   ├── SessionTimeline.vue    # Event log timeline
│   │   ├── TestTypeForm.vue       # Create/edit test type form
│   │   └── BulkImportDialog.vue   # CSV upload dialog
│   ├── global/
│   │   ├── EmptyState.vue         # Empty list placeholder
│   │   └── LoadingSkeleton.vue    # Skeleton loader
│   ├── reports/
│   │   ├── AnswersReview.vue      # Question-by-question review
│   │   ├── BarChart.vue           # SVG bar chart
│   │   ├── ComparisonTable.vue    # Session comparison
│   │   ├── InterpretationCard.vue # Dimension interpretation
│   │   ├── RadarChart.vue         # SVG radar/spider chart
│   │   └── ScoreTable.vue         # Scores summary table
│   ├── test-runner/
│   │   ├── ProgressBar.vue        # Answer progress indicator
│   │   ├── QuestionLikert.vue     # Likert scale renderer
│   │   ├── QuestionPairedChoice.vue # A/B choice renderer
│   │   ├── QuestionRenderer.vue   # Dynamic question dispatcher
│   │   ├── QuestionSingleChoice.vue # Single choice renderer
│   │   ├── SubtestIntro.vue       # Subtest instruction screen
│   │   └── TimerBar.vue           # Countdown timer bar
│   └── ui/                        # shadcn-vue components (existing)
├── composables/
│   ├── useAuth.ts                 # Auth composable (existing)
│   ├── useConfirm.ts             # Confirmation dialog
│   ├── useTestRunner.ts          # Runner state + auto-save
│   ├── useTimer.ts               # Countdown timer
│   └── useToast.ts               # Toast notifications
├── db/
│   ├── index.ts                  # Drizzle client (existing)
│   ├── migrations/               # SQL migrations
│   └── schema/                   # DB schema (existing)
│       ├── index.ts
│       ├── participants.ts
│       ├── sessionLogs.ts
│       ├── sessions.ts
│       ├── testTypes.ts
│       └── users.ts
├── layouts/
│   ├── default.vue               # Main layout with navbar (existing)
│   └── login.vue                 # Login layout (existing)
├── middleware/
│   └── auth.ts                   # Client-side auth guard (existing)
├── pages/
│   ├── admin/
│   │   ├── participants.vue      # Participants list (existing template)
│   │   ├── participants/
│   │   │   ├── create.vue        # New participant
│   │   │   └── [id]/edit.vue     # Edit participant
│   │   ├── sessions.vue          # Sessions list (existing template)
│   │   ├── sessions/
│   │   │   └── [id].vue          # Session detail
│   │   │   └── [id]/report.vue   # Admin report view
│   │   ├── test-types.vue        # Test types list (existing template)
│   │   └── test-types/
│   │       ├── create.vue        # Create test type
│   │       └── [slug]/edit.vue   # Edit test type
│   ├── index.vue                 # Dashboard (existing)
│   ├── login.vue                 # Login page (existing)
│   └── take/
│       ├── [token].vue           # Test runner entry + instruction
│       ├── [token]/complete.vue  # Thank-you page
│       └── [token]/result.vue    # Participant result view
├── plugins/
│   └── api-error-handler.ts     # Global fetch error interceptor
├── server/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── bulk-sessions.post.ts
│   │   │   └── test-types/      # CRUD (Phase 1)
│   │   ├── auth/                # Login, register, me, logout (existing)
│   │   ├── participants/        # CRUD (Phase 1)
│   │   ├── sessions/            # CRUD + logs, verify, export (Phase 1, 3, 4)
│   │   └── tests/               # List, detail, submit (existing)
│   ├── middleware/
│   │   └── auth.ts              # Server-side auth guard (existing)
│   └── utils/
│       ├── auth.ts              # JWT + bcrypt helpers (existing)
│       ├── drizzle.ts           # DB client singleton (existing)
│       ├── scoring.ts           # Scoring engine (existing)
│       ├── tests.ts             # Test helpers (existing)
│       └── validation.ts        # Zod schemas (Phase 6)
├── nuxt.config.ts               # Nuxt config (existing)
├── drizzle.config.ts            # Drizzle config (existing)
├── error.vue                    # Global error page (Phase 5)
├── package.json                 # Dependencies (existing)
└── .env.example                 # Environment template (Phase 6)
```

---

## Execution Priority

| Priority | Phase | Rationale |
|----------|-------|-----------|
| 🥇 P0 | Phase 1 | Admin CRUD unlocks all other work |
| 🥇 P0 | Phase 2 | Test runner is the core user-facing feature |
| 🥇 P0 | Phase 3 | Invitation + lifecycle completes the workflows |
| 🥈 P1 | Phase 4 | Reports are important but can start with basic print |
| 🥉 P2 | Phase 5 | Polish adds quality but not functionality |
| 🥉 P2 | Phase 6 | Hardening is production-gate; defer for MVP launch |

**MVP Definition** = Phase 1 + Phase 2 + Phase 3 (core workflow functional).

---

## Quick Start Notes

### Running Locally
```bash
# Dev server
cd psy-engine && pnpm run dev

# DB migrations
pnpm run db:generate    # Generate migration from schema changes
pnpm run db:migrate     # Apply migrations to DB
pnpm run db:push        # Push schema directly (dev only)
```

### Environment Variables
```
DATABASE_URL=postgres://mbx@127.0.0.1:5432/psy_engine
JWT_SECRET=your-secret-here
```

### Testing Admin Flow
1. Login at `https://psy.yumalab.my.id/login` (seed: `admin@psy.test` / `admin123`)
2. Create a test type (use existing CFIT/PAPI/EPPS as reference)
3. Create participant
4. Create session (select test type + participant)
5. Copy invitation link and open in incognito
6. Take the test
7. View results as admin
