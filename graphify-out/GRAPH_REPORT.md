# Graph Report - .  (2026-08-01)

## Corpus Check
- 359 files · ~329,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1510 nodes · 1595 edges · 225 communities (185 shown, 40 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Settings Admin UI
- Session Detail Admin
- DB Schema Registry
- Take Test Runner
- Sessions List Admin
- UI Select Primitives
- Participants Admin
- UI Dialog Primitives
- API Validation Schemas
- EPPS Scoring Engine
- Test Type Config Editor
- Reports Dashboard UI
- UI Sheet Primitives
- Psikogram Create Flow
- UI Table Primitives
- Scoring Config Form
- Psikogram Detail View
- Questions Builder
- Test Complete Page
- Image Choice Form
- Public Join Claim
- Package Dependencies
- UI Tabs Primitives
- Subtest Navigation Logic
- Activity Logs UI
- Psikograms List UI
- Psikogram Print View
- Session Compare UI
- Session Full Report
- Test Type Edit Page
- Test Type Detail Page
- Legacy Data Migration
- Report Builders API
- Scoring Orchestration
- Shadcn Components Config
- Paired Choice Form
- UI Card Primitives
- Psikogram Edit Page
- Public Psikogram View
- Instruction Question Form
- Dashboard Home
- Test Result Panel
- Question Edit Dialog
- Simple Choice Form
- NPM Scripts
- Test Types List UI
- Psikogram Analyzer
- Default Layout Nav
- Test Type Create Page
- RBAC Access Control
- Assets public psychology cfit
- RadarChart
- EppsMatrixEditor
- drizzle kit
- login
- activityLog
- scoreDisplay
- PairedInterpretationsEditor
- index
- index
- devFillAnswers
- SessionsStatusChart
- PaginationBar
- DimensionsEditor
- ExamplesEditor
- RangesEditor
- ScalesEditor
- StringListEditor
- index
- Switch
- draw
- DropdownMenuCheckboxItem
- DropdownMenuContent
- DropdownMenuRadioItem
- DropdownMenuSubContent
- Input
- ResponsiveTable
- Textarea
- error
- jsconfig json
- buildRoleDraft
- applyDevAnswers
- beginAutoSave
- sessionLifecycle
- sessionStatus
- systemAccess
- ConfirmDialog
- BarChart
- InterpretationsEditor
- index
- index
- DropdownMenu
- DropdownMenuItem
- DropdownMenuLabel
- DropdownMenuRadioGroup
- DropdownMenuSub
- DropdownMenuSubTrigger
- Label
- Separator
- useConfirm
- confirmLockToggle
- rateLimit
- sessionLogBus
- systemFlags
- DropdownMenuSeparator
- Skeleton
- useAppSettings
- useAuth
- finishCreate
- index get
- stream get
- clsx
- AspekItem
- drizzle orm
- iconify vue
- jsonwebtoken
- lucide vue
- lucide vue next
- nuxtjs tailwindcss
- postgres
- reka ui
- shadcn vue
- tailwind merge
- vue sonner
- vueuse core
- copySessionInvite
- loadActiveTestTypes
- loadRoleOptions
- pnpm allowBuilds Config
- status put
- App Favicon
- Assets public
- Project Plan
- lucide vue 1 27
- robots txt Allow All
- openInvitationClaimSchema

## God Nodes (most connected - your core abstractions)
1. `scripts` - 11 edges
2. `saveAnswers()` - 11 edges
3. `buildAllReports()` - 11 edges
4. `scoreEppsMatrix()` - 10 edges
5. `submitTest()` - 9 edges
6. `restoreInProgress()` - 9 edges
7. `stopCountdown()` - 7 edges
8. `onSubtestTimeout()` - 7 edges
9. `tailwind` - 6 edges
10. `emit` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Nuxt Minimal Starter Template` --conceptually_related_to--> `pnpm allowBuilds Config (esbuild, vue-demi disabled)`  [INFERRED]
  README.md → pnpm-workspace.yaml
- `countAnswers()` --references--> `EPPS_EXCLUDED_DIAGONAL`  [EXTRACTED]
  server/utils/scoring/epps.js → utils/eppsConstants.js
- `requirePermission()` --calls--> `roleHasPermission()`  [EXTRACTED]
  server/utils/access.js → server/utils/permissions.js
- `requireAnyPermission()` --calls--> `roleHasAnyPermission()`  [EXTRACTED]
  server/utils/access.js → server/utils/permissions.js
- `scoreEppsMatrix()` --calls--> `getEppsCategory()`  [EXTRACTED]
  server/utils/scoring/epps.js → server/utils/scoring/eppsThresholds.js

## Import Cycles
- None detected.

## Communities (225 total, 40 thin omitted)

### Community 0 - "Settings Admin UI"
Cohesion: 0.02
Nodes (69): activeTab, addRoleError, addRoleForm, addRoleLoading, addUserError, addUserForm, addUserLoading, appLogoInput (+61 more)

### Community 1 - "Session Detail Admin"
Cohesion: 0.05
Nodes (39): abandonSession(), answeredSummary, answerRows, appendLog(), { can, getAuthHeaders }, canAbandon, canDelete, canVerify (+31 more)

### Community 2 - "DB Schema Registry"
Cohesion: 0.08
Nodes (26): client, db, activityLogs, appSettings, openInvitations, participants, permissions, psikograms (+18 more)

### Community 3 - "Take Test Runner"
Cohesion: 0.04
Nodes (40): accessBlocked, activeSubtestCode, answerableProgress, answers, autoSaveInterval, canGoBack, canProceed, config (+32 more)

### Community 4 - "Sessions List Admin"
Cohesion: 0.05
Nodes (31): activeTab, activeTestTypes, bulkParticipantIds, bulkResult, { can, getAuthHeaders }, columns, copied, copiedId (+23 more)

### Community 5 - "UI Select Primitives"
Cohesion: 0.05
Nodes (26): emits, forwarded, props, delegatedProps, emits, forwarded, props, delegatedProps (+18 more)

### Community 6 - "Participants Admin"
Cohesion: 0.07
Nodes (30): { can, getAuthHeaders }, columns, { confirm }, deleteParticipant(), editingId, form, formError, formLoading (+22 more)

### Community 7 - "UI Dialog Primitives"
Cohesion: 0.06
Nodes (21): emits, forwarded, props, props, delegatedProps, emits, forwarded, props (+13 more)

### Community 8 - "API Validation Schemas"
Cohesion: 0.07
Nodes (23): appSettingsSchema, loginSchema, openInvitationCreateSchema, participantCreateSchema, participantUpdateSchema, passwordChangeSchema, profileUpdateSchema, psikogramCreateSchema (+15 more)

### Community 9 - "EPPS Scoring Engine"
Cohesion: 0.11
Nodes (24): computeBD(), computeBH(), countAnswers(), extractChoice(), getColumnGroupColumnQuestions(), getRowGroupRowQuestions(), levelFromCategory(), NEED_DISPLAY (+16 more)

### Community 10 - "Test Type Config Editor"
Cohesion: 0.09
Nodes (17): advancedError, advancedText, emit, instructionList, KNOWN_KEYS, local, mode, normalize() (+9 more)

### Community 11 - "Reports Dashboard UI"
Cohesion: 0.09
Nodes (24): activeTab, activityStats, { can, getAuthHeaders }, completionChart, completionStats, error, exportCurrent(), from (+16 more)

### Community 12 - "UI Sheet Primitives"
Cohesion: 0.08
Nodes (16): sheetVariants, emits, forwarded, props, props, delegatedProps, emits, forwarded (+8 more)

### Community 13 - "Psikogram Create Flow"
Cohesion: 0.09
Nodes (20): analysisNote, analysisResult, analyzeSession(), analyzing, calculatedAge, defaultSections, eligibleSessions, filteredSessions (+12 more)

### Community 14 - "UI Table Primitives"
Cohesion: 0.11
Nodes (10): props, props, props, props, delegatedProps, props, props, props (+2 more)

### Community 15 - "Scoring Config Form"
Cohesion: 0.12
Nodes (17): ageBasedNorms, algorithm, classificationRanges, defaultAgeGroup, dimensionKeys, dimensions, emit, interpretations (+9 more)

### Community 16 - "Psikogram Detail View"
Cohesion: 0.11
Nodes (11): { can, getAuthHeaders }, { confirm }, generatingLink, loadError, loading, psikogram, route, sectionMeta (+3 more)

### Community 17 - "Questions Builder"
Cohesion: 0.14
Nodes (13): dialogOpen, editingIndex, editingItem, emit, isEppsShape, items, { mode, jsonText, jsonError, showJson, showBuilder }, move() (+5 more)

### Community 18 - "Test Complete Page"
Cohesion: 0.12
Nodes (11): answeredLabel, battery, completedAtLabel, currentTestName, durationLabel, error, joinPath, loading (+3 more)

### Community 19 - "Image Choice Form"
Cohesion: 0.18
Nodes (15): addOption(), answer, emit, imagePath, isCorrect(), number, optionKey(), options (+7 more)

### Community 20 - "Public Join Claim"
Cohesion: 0.12
Nodes (14): accessBlocked, canSubmit, error, form, invitation, isMulti, loading, { refresh: refreshAppSettings, systemLocked, maintenanceMode, maintenanceMessage } (+6 more)

### Community 21 - "Package Dependencies"
Cohesion: 0.13
Nodes (15): bcryptjs, class-variance-authority, nuxt, dependencies, bcryptjs, class-variance-authority, nuxt, shadcn-nuxt (+7 more)

### Community 22 - "UI Tabs Primitives"
Cohesion: 0.13
Nodes (10): emits, forwarded, props, delegatedProps, props, delegatedProps, props, delegatedProps (+2 more)

### Community 23 - "Subtest Navigation Logic"
Cohesion: 0.28
Nodes (15): continueFromInstruction(), findNextSubtestIndex(), getSubtestConfig(), goToComplete(), nextQuestion(), onSubtestTimeout(), persistSubtestTime(), restoreInProgress() (+7 more)

### Community 24 - "Activity Logs UI"
Cohesion: 0.14
Nodes (10): { can, getAuthHeaders }, category, categoryTabs, level, listError, loading, logs, page (+2 more)

### Community 25 - "Psikograms List UI"
Cohesion: 0.14
Nodes (10): { can, getAuthHeaders }, columns, { confirm }, filteredPsikograms, loadError, psikograms, route, search (+2 more)

### Community 26 - "Psikogram Print View"
Cohesion: 0.15
Nodes (10): accentColor, formatDate(), formatLocation(), { getAuthHeaders }, loading, mutedColor, psikogram, route (+2 more)

### Community 27 - "Session Compare UI"
Cohesion: 0.14
Nodes (10): aggregate, dimensionKeys, error, { getAuthHeaders }, loading, participantId, participantSearch, sessions (+2 more)

### Community 28 - "Session Full Report"
Cohesion: 0.16
Nodes (12): answerRows, canRescore, error, { getAuthHeaders, can }, hasScores, load(), loading, rescoreLoading (+4 more)

### Community 29 - "Test Type Edit Page"
Cohesion: 0.14
Nodes (12): config, form, { getAuthHeaders }, loadError, loading, questions, route, scoringConfig (+4 more)

### Community 30 - "Test Type Detail Page"
Cohesion: 0.14
Nodes (9): actionError, { can, getAuthHeaders }, { confirm }, loadError, loading, route, testType, toast (+1 more)

### Community 31 - "Legacy Data Migration"
Cohesion: 0.20
Nodes (12): buildPAPIScoringConfig(), cfitNorms, cfitV15, convertCFITFromV15(), convertEPPSQuestions(), convertPAPIQuestions(), __dirname, eppsExport (+4 more)

### Community 32 - "Report Builders API"
Cohesion: 0.31
Nodes (12): buildAdminActivityReport(), buildAllReports(), buildCompletionReport(), buildCorporateReport(), buildExaminerWorkload(), buildPeriodCompare(), buildPeriodSummary(), buildPsikogramPipeline() (+4 more)

### Community 33 - "Scoring Orchestration"
Cohesion: 0.30
Nodes (13): buildAllInterpretations(), buildInterpretation(), buildPairedInterpretations(), calculateScore(), classifyIq(), convertRawToIq(), matchPapiLevel(), resolveAgeGroup() (+5 more)

### Community 34 - "Shadcn Components Config"
Cohesion: 0.15
Nodes (12): aliases, components, utils, $schema, style, tailwind, baseColor, config (+4 more)

### Community 35 - "Paired Choice Form"
Cohesion: 0.17
Nodes (12): emit, number, optA, optB, props, rebuild(), scaleA, scaleB (+4 more)

### Community 36 - "UI Card Primitives"
Cohesion: 0.15
Nodes (6): props, props, props, props, props, props

### Community 37 - "Psikogram Edit Page"
Cohesion: 0.15
Nodes (10): calculatedAge, form, { getAuthHeaders }, loadError, loading, route, saving, sectionMeta (+2 more)

### Community 38 - "Public Psikogram View"
Cohesion: 0.17
Nodes (10): accentColor, error, formatDate(), formatLocation(), loading, mutedColor, psikogram, route (+2 more)

### Community 39 - "Instruction Question Form"
Cohesion: 0.18
Nodes (11): emit, examples, instruction, props, rules, setKey(), subtestKey, subtitle (+3 more)

### Community 40 - "Dashboard Home"
Cohesion: 0.17
Nodes (10): completedCount, loading, participantsData, recentSessions, sessionsData, stats, STATUS_ORDER, statusChartData (+2 more)

### Community 41 - "Test Result Panel"
Cohesion: 0.20
Nodes (7): birthDate, chartDimensions, formatNum(), needScore(), participantGender, props, view

### Community 42 - "Question Edit Dialog"
Cohesion: 0.22
Nodes (9): blankFor(), changeKind(), draft, emit, formComponent, isNew, kind, onSave() (+1 more)

### Community 43 - "Simple Choice Form"
Cohesion: 0.25
Nodes (10): addOption(), emit, number, options, props, removeOption(), setKey(), subtestKey (+2 more)

### Community 44 - "NPM Scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:generate, db:migrate, db:push, db:seed-rbac, db:studio, dev (+3 more)

### Community 45 - "Test Types List UI"
Cohesion: 0.18
Nodes (8): { can, getAuthHeaders }, columns, { confirm }, route, tests, testsError, testsSuccess, toast

### Community 46 - "Psikogram Analyzer"
Cohesion: 0.27
Nodes (9): analysisToSections(), analyzePapiScoresToPsikogram(), buildPapiScores(), calculateAspectScore(), computeScaleMaxes(), getDefaultSections(), percentToRating(), PSIKOGRAM_PAPI_MAPPING (+1 more)

### Community 47 - "Default Layout Nav"
Cohesion: 0.20
Nodes (6): colorMode, mobileMenuOpen, navItems, route, { systemName, tagline, logo, refresh: refreshAppSettings }, { user, can, logout }

### Community 48 - "Test Type Create Page"
Cohesion: 0.20
Nodes (8): config, form, { getAuthHeaders }, questions, scoringConfig, submitError, submitting, toast

### Community 49 - "RBAC Access Control"
Cohesion: 0.33
Nodes (7): requireAnyPermission(), requirePermission(), getRolePermissionKeys(), PERMISSIONS, roleHasAllPermissions(), roleHasAnyPermission(), roleHasPermission()

### Community 50 - "Assets public psychology cfit"
Cohesion: 0.22
Nodes (9): Assets: public/psychology/cfit/subtes1 (12 files), Assets: public/psychology/cfit/subtes1/contoh (3 files), Assets: public/psychology/cfit/subtes2 (14 files), Assets: public/psychology/cfit/subtes2/contoh (2 files), Assets: public/psychology/cfit/subtes3 (12 files), Assets: public/psychology/cfit/subtes3/contoh (3 files), Assets: public/psychology/cfit/subtes4 (8 files), Assets: public/psychology/cfit/subtes4/contoh (3 files) (+1 more)

### Community 51 - "RadarChart"
Cohesion: 0.33
Nodes (8): angleFor(), axisPoint(), dataPoints, labelPoint(), props, ringPoints(), rings, valuePoint()

### Community 52 - "EppsMatrixEditor"
Cohesion: 0.36
Nodes (8): buildItem(), byNumber, emit, generate(), groups, positionFor(), props, updateText()

### Community 53 - "drizzle kit"
Cohesion: 0.22
Nodes (8): drizzle-kit, @nuxtjs/color-mode, devDependencies, drizzle-kit, @nuxtjs/color-mode, name, private, type

### Community 54 - "login"
Cohesion: 0.22
Nodes (6): email, error, loading, { login, isAuthenticated }, password, { systemName, tagline, logo, maintenanceMode, maintenanceMessage, systemLocked, refresh: refreshAppSettings }

### Community 55 - "activityLog"
Cohesion: 0.39
Nodes (8): buildActivityFromEvent(), describeApiActivity(), logActivity(), logEventActivity(), mapCategory(), METHOD_ACTION, MUTED_PATH_PATTERNS, shouldSkipActivityLog()

### Community 56 - "scoreDisplay"
Cohesion: 0.36
Nodes (6): buildCfitView(), buildEppsView(), buildGenericView(), buildPapiView(), buildScoreView(), scoresProfile()

### Community 57 - "PairedInterpretationsEditor"
Cohesion: 0.50
Nodes (7): emit, entryFor(), modeFor(), props, setMode(), updateLevel(), updateRanges()

### Community 58 - "index"
Cohesion: 0.29
Nodes (4): props, props, props, avatarVariant

### Community 59 - "index"
Cohesion: 0.25
Nodes (4): props, props, forwardedProps, props

### Community 60 - "devFillAnswers"
Cohesion: 0.52
Nodes (6): buildDevAnswers(), getAnswerableQuestions(), mergeDevAnswers(), normalizeOptionId(), normalizeOptions(), pickDevAnswer()

### Community 61 - "SessionsStatusChart"
Cohesion: 0.33
Nodes (5): ariaLabel, props, segments, STATUS_COLORS, total

### Community 62 - "PaginationBar"
Cohesion: 0.33
Nodes (5): from, pageItems, props, to, totalPages

### Community 63 - "DimensionsEditor"
Cohesion: 0.53
Nodes (5): addRow(), emit, props, removeRow(), updateRow()

### Community 64 - "ExamplesEditor"
Cohesion: 0.53
Nodes (5): addRow(), emit, props, removeRow(), updateRow()

### Community 65 - "RangesEditor"
Cohesion: 0.53
Nodes (5): addRow(), emit, props, removeRow(), updateRow()

### Community 66 - "ScalesEditor"
Cohesion: 0.53
Nodes (5): addRow(), emit, props, removeRow(), updateRow()

### Community 67 - "StringListEditor"
Cohesion: 0.53
Nodes (5): addItem(), emit, props, removeItem(), updateItem()

### Community 68 - "index"
Cohesion: 0.33
Nodes (4): delegatedProps, emits, forwarded, props

### Community 69 - "Switch"
Cohesion: 0.33
Nodes (4): delegatedProps, emits, forwarded, props

### Community 70 - "draw"
Cohesion: 0.40
Nodes (6): draw(), drawTouch(), initSignatureCanvas(), pointerPos(), startDrawing(), startDrawingTouch()

### Community 73 - "DropdownMenuCheckboxItem"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 74 - "DropdownMenuContent"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 75 - "DropdownMenuRadioItem"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 76 - "DropdownMenuSubContent"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 77 - "Input"
Cohesion: 0.40
Nodes (3): emits, modelValue, props

### Community 78 - "ResponsiveTable"
Cohesion: 0.40
Nodes (3): emits, items, props

### Community 79 - "Textarea"
Cohesion: 0.40
Nodes (3): emits, modelValue, props

### Community 80 - "error"
Cohesion: 0.40
Nodes (3): { isAuthenticated }, isNotFound, props

### Community 81 - "jsconfig json"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, extends, ./.nuxt/tsconfig.json

### Community 82 - "buildRoleDraft"
Cohesion: 0.40
Nodes (5): buildRoleDraft(), handleAddRole(), loadRbac(), resetRoleDraft(), saveRole()

### Community 83 - "applyDevAnswers"
Cohesion: 0.50
Nodes (5): applyDevAnswers(), devFillAll(), devFillCurrent(), devJumpToEnd(), showDevNotice()

### Community 84 - "beginAutoSave"
Cohesion: 0.40
Nodes (5): beginAutoSave(), devStartAndFill(), normalizeQuestion(), prepareQuestions(), startTest()

### Community 85 - "sessionLifecycle"
Cohesion: 0.50
Nodes (3): autoAbandonStaleSessions(), logSessionEvent(), VALID_TRANSITIONS

### Community 87 - "systemAccess"
Cohesion: 0.70
Nodes (4): parseSystemAccessError(), systemAccessIcon(), systemAccessMessage(), systemAccessTitle()

### Community 88 - "ConfirmDialog"
Cohesion: 0.67
Nodes (3): onOpenChange(), respond(), state

### Community 90 - "InterpretationsEditor"
Cohesion: 0.67
Nodes (3): emit, props, updateRanges()

### Community 93 - "DropdownMenu"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 94 - "DropdownMenuItem"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 95 - "DropdownMenuLabel"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 96 - "DropdownMenuRadioGroup"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 97 - "DropdownMenuSub"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 98 - "DropdownMenuSubTrigger"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 102 - "confirmLockToggle"
Cohesion: 0.50
Nodes (4): confirmLockToggle(), patchSystemStatus(), saveMaintenanceMessage(), toggleMaintenance()

### Community 103 - "rateLimit"
Cohesion: 0.67
Nodes (3): buckets, checkRateLimit(), pruneExpired()

### Community 112 - "finishCreate"
Cohesion: 0.67
Nodes (3): finishCreate(), goToPage(), loadSessions()

## Knowledge Gaps
- **774 isolated node(s):** `$schema`, `style`, `typescript`, `config`, `css` (+769 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Dependencies` to `postgres`, `reka ui`, `shadcn vue`, `tailwind merge`, `vue sonner`, `vueuse core`, `clsx`, `drizzle kit`, `drizzle orm`, `iconify vue`, `jsonwebtoken`, `lucide vue`, `lucide vue next`, `nuxtjs tailwindcss`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `scripts` connect `NPM Scripts` to `drizzle kit`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `drizzle orm` to `Package Dependencies`?**
  _High betweenness centrality (0.000) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `typescript` to the rest of the system?**
  _774 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings Admin UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02247191011235955 - nodes in this community are weakly interconnected._
- **Should `Session Detail Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.04810360777058279 - nodes in this community are weakly interconnected._
- **Should `DB Schema Registry` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._