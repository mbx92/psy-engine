# Graph Report - .  (2026-07-26)

## Corpus Check
- 204 files · ~260,437 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 526 nodes · 530 edges · 70 communities (62 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 58,843 input · 0 output

## Community Hubs (Navigation)
- Select Component
- NPM Dependencies
- Project Plan (PLAN.md)
- Dialog Component
- Test Runner Page
- Admin Settings Page
- Sheet Component
- Table Component
- Drizzle DB Schema
- Package Scripts
- Legacy Data Migration
- Tabs Component
- shadcn-vue Config
- Card Component
- Permissions & Roles
- Avatar Component
- Dropdown Menu Extras
- Login Page
- Scoring Engine
- Default Layout
- Checkbox Component
- Test Listing Page
- Dropdown Checkbox Item
- Dropdown Menu Content
- Dropdown Radio Item
- Dropdown Sub Content
- Input Component
- Responsive Table Component
- Textarea Component
- Badge Component
- Button Component
- Dropdown Menu Root
- Dropdown Menu Item
- Dropdown Menu Label
- Dropdown Radio Group
- Dropdown Sub Menu
- Dropdown Sub Trigger
- Label Component
- Separator Component
- Admin Sessions Page
- Dropdown Separator
- Admin Participants Page
- Admin Test Types Page
- Home Dashboard Page

## God Nodes (most connected - your core abstractions)
1. `Psy-Engine Phase Development Plan` - 14 edges
2. `scripts` - 10 edges
3. `Phase 1: CRUD API & Admin Pages` - 9 edges
4. `Phase 3: Invitation System & Session Lifecycle` - 9 edges
5. `migrate()` - 8 edges
6. `Phase 2: Public Test Runner Page` - 7 edges
7. `Phase 5: Error Handling, Loading States, Toasts & UI Polish` - 7 edges
8. `Execution Priority Ranking` - 7 edges
9. `tailwind` - 6 edges
10. `Phase 4: Results & Reports` - 6 edges

## Surprising Connections (you probably didn't know these)
- `pnpm allowBuilds Config (esbuild, vue-demi disabled)` --conceptually_related_to--> `Psy-Engine Phase Development Plan`  [AMBIGUOUS]
  pnpm-workspace.yaml → PLAN.md
- `Nuxt Minimal Starter Template` --conceptually_related_to--> `Nuxt 3 Framework`  [INFERRED]
  README.md → PLAN.md
- `@lucide/vue@1.27.0 minimumReleaseAge Exclusion` --conceptually_related_to--> `shadcn-vue UI Components`  [INFERRED]
  pnpm-workspace.yaml → PLAN.md
- `robots.txt Allow-All Crawl Policy` --conceptually_related_to--> `Production Tunnel Deployment (psy.yumalab.my.id)`  [INFERRED]
  public/robots.txt → PLAN.md
- `Nuxt Minimal Starter Template` --conceptually_related_to--> `pnpm allowBuilds Config (esbuild, vue-demi disabled)`  [INFERRED]
  README.md → pnpm-workspace.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phased Development Roadmap (Phase 0-6)** — plan_phase0_settings, plan_phase1_crud_api_admin_pages, plan_phase2_public_test_runner, plan_phase3_invitation_system, plan_phase4_results_reports, plan_phase5_error_handling_ui_polish, plan_phase6_production_hardening [EXTRACTED 1.00]
- **Core Data Model Entities (Test Types, Participants, Sessions, Session Logs, Users)** — plan_test_types_entity, plan_participants_entity, plan_sessions_entity, plan_session_logs_entity, plan_users_entity [INFERRED 0.85]
- **UI/Toast Component Stack (shadcn-vue, reka-ui, vue-sonner)** — plan_shadcn_vue, plan_reka_ui, plan_vue_sonner [INFERRED 0.75]

## Communities (70 total, 8 thin omitted)

### Community 0 - "Select Component"
Cohesion: 0.05
Nodes (26): emits, forwarded, props, delegatedProps, emits, forwarded, props, delegatedProps (+18 more)

### Community 1 - "NPM Dependencies"
Cohesion: 0.05
Nodes (37): bcryptjs, class-variance-authority, clsx, drizzle-orm, @iconify/vue, jsonwebtoken, @lucide/vue, lucide-vue-next (+29 more)

### Community 2 - "Project Plan (PLAN.md)"
Cohesion: 0.09
Nodes (34): Production Tunnel Deployment (psy.yumalab.my.id), Drizzle ORM Client, Execution Priority Ranking, Inactivity Detection (Auto-Abandon Sessions), JWT Authentication (JWT_SECRET), MVP Definition (Phase 1 + 2 + 3), Nuxt 3 Framework, Participants Entity (DB table) (+26 more)

### Community 3 - "Dialog Component"
Cohesion: 0.06
Nodes (21): emits, forwarded, props, props, delegatedProps, emits, forwarded, props (+13 more)

### Community 4 - "Test Runner Page"
Cohesion: 0.07
Nodes (26): answers, config, currentIndex, currentQuestion, currentSubtest, error, formattedTime, hasCurrentAnswer (+18 more)

### Community 5 - "Admin Settings Page"
Cohesion: 0.07
Nodes (20): activeTab, addUserError, addUserForm, addUserLoading, isAdmin, passwordError, passwordForm, passwordLoading (+12 more)

### Community 6 - "Sheet Component"
Cohesion: 0.08
Nodes (16): sheetVariants, emits, forwarded, props, props, delegatedProps, emits, forwarded (+8 more)

### Community 7 - "Table Component"
Cohesion: 0.11
Nodes (10): props, props, props, props, delegatedProps, props, props, props (+2 more)

### Community 8 - "Drizzle DB Schema"
Cohesion: 0.17
Nodes (10): client, db, participants, sessionLogs, sessions, testTypeNorms, testTypes, users (+2 more)

### Community 9 - "Package Scripts"
Cohesion: 0.12
Nodes (16): drizzle-kit, devDependencies, drizzle-kit, name, private, scripts, build, db:generate (+8 more)

### Community 10 - "Legacy Data Migration"
Cohesion: 0.17
Nodes (15): buildCFITScoringConfig(), buildPAPIScoringConfig(), cfitConfig, cfitNorms, cfitQuestions, convertCFITConfig(), convertCFITQuestions(), convertEPPSQuestions() (+7 more)

### Community 11 - "Tabs Component"
Cohesion: 0.13
Nodes (10): emits, forwarded, props, delegatedProps, props, delegatedProps, props, delegatedProps (+2 more)

### Community 12 - "shadcn-vue Config"
Cohesion: 0.15
Nodes (12): aliases, components, utils, $schema, style, tailwind, baseColor, config (+4 more)

### Community 13 - "Card Component"
Cohesion: 0.15
Nodes (6): props, props, props, props, props, props

### Community 14 - "Permissions & Roles"
Cohesion: 0.29
Nodes (7): requirePermission(), PERMISSIONS, ROLE_PERMISSIONS, roleHasAllPermissions(), roleHasAnyPermission(), roleHasPermission(), ROLES

### Community 15 - "Avatar Component"
Cohesion: 0.29
Nodes (4): props, props, props, avatarVariant

### Community 16 - "Dropdown Menu Extras"
Cohesion: 0.25
Nodes (4): props, props, forwardedProps, props

### Community 17 - "Login Page"
Cohesion: 0.25
Nodes (5): email, error, loading, { login, isAuthenticated }, password

### Community 18 - "Scoring Engine"
Cohesion: 0.57
Nodes (7): buildAllInterpretations(), buildInterpretation(), calculateScore(), scoreCorrectCount(), scoreDimensionSum(), scoreLikertAverage(), scorePairedChoice()

### Community 19 - "Default Layout"
Cohesion: 0.29
Nodes (4): mobileMenuOpen, navItems, route, { user, can, logout }

### Community 20 - "Checkbox Component"
Cohesion: 0.33
Nodes (4): delegatedProps, emits, forwarded, props

### Community 21 - "Test Listing Page"
Cohesion: 0.33
Nodes (3): error, loading, tests

### Community 23 - "Dropdown Checkbox Item"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 24 - "Dropdown Menu Content"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 25 - "Dropdown Radio Item"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 26 - "Dropdown Sub Content"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 27 - "Input Component"
Cohesion: 0.40
Nodes (3): emits, modelValue, props

### Community 28 - "Responsive Table Component"
Cohesion: 0.40
Nodes (3): emits, items, props

### Community 29 - "Textarea Component"
Cohesion: 0.40
Nodes (3): emits, modelValue, props

### Community 32 - "Dropdown Menu Root"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 33 - "Dropdown Menu Item"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 34 - "Dropdown Menu Label"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 35 - "Dropdown Radio Group"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 36 - "Dropdown Sub Menu"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 37 - "Dropdown Sub Trigger"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 40 - "Admin Sessions Page"
Cohesion: 0.50
Nodes (3): activeColumns, { can }, completedColumns

## Ambiguous Edges - Review These
- `Psy-Engine Phase Development Plan` → `pnpm allowBuilds Config (esbuild, vue-demi disabled)`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to

## Knowledge Gaps
- **278 isolated node(s):** `$schema`, `style`, `typescript`, `config`, `css` (+273 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Psy-Engine Phase Development Plan` and `pnpm allowBuilds Config (esbuild, vue-demi disabled)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `NPM Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `typescript` to the rest of the system?**
  _278 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Select Component` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `NPM Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Project Plan (PLAN.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Should `Dialog Component` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._