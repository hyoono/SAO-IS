# SAO-IS Handoff Instructions for Continuation

> **Project:** SAO-IS (Student Affairs Office Information System)
> **Repo:** `/home/joshu/SAO-IS`
> **Stack:** Laravel 11 (backend) + React/Vite/TailwindCSS v4 (frontend) + MySQL
> **Previous conversation recovery:** [recovered_chat_history.md](file:///home/joshu/.gemini/antigravity-ide/brain/54abc802-deb0-4eda-9943-109f91f080be/recovered_chat_history.md)

---

## What Was Just Completed (Issues 1-4 Fixes)

### ✅ Issue 1: Light Mode Contrast
**30+ CSS variables** added to [index.css](file:///home/joshu/SAO-IS/frontend/src/index.css) for both `:root` (light) and `.dark` themes. All hard-coded dark-only colors (`text-blue-200`, `text-emerald-200`, `bg-slate-950/*`, etc.) replaced with semantic CSS variables across ~20 files.

**Key variable naming convention:**
- `--th-btn-primary-*`, `--th-btn-success-*`, `--th-btn-danger-*`, `--th-btn-warning-*` — action button colors
- `--th-link`, `--th-link-hover` — link colors
- `--th-loading-text` — loading state text
- `--th-card-bg` — card backgrounds
- `--th-section-*` — section wrapper colors
- `--th-msg-info-*`, `--th-msg-error-*` — message/alert colors
- `--th-step-num-*` — workflow step number circles
- `--th-badge-*` — badge colors (already existed)

### ⚠️ Pending: Light Mode Contrast Fine-tuning
- **User feedback:** "Some elements still look off in light mode, not much compared to before, but there is still room for improvement."
- **Action for next agent/session:** Ask the user to identify exactly which elements (e.g., specific buttons, modals, borders, inputs) still look off. If possible, ask for a screenshot. Focus on fine-tuning `index.css` `--th-*` variables once those elements are identified.

### ✅ Issue 2: Stale Document Status
- [useDocuments.js](file:///home/joshu/SAO-IS/frontend/src/hooks/useDocuments.js) — added `staleTime: 0`, `refetchOnMount: 'always'`, `refetchOnWindowFocus: true`
- [ApprovalDetailPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/ApprovalDetailPage.jsx) — added `queryClient.invalidateQueries({ queryKey: ['documents'] })` after approval actions
- [DocumentDetailPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/DocumentDetailPage.jsx) — added document + documents list invalidation after version upload

### ✅ Issue 3: Missing Role Filters
- [UsersPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/UsersPage.jsx) line 8 — changed from hardcoded 5-role array to `Object.keys(ROLE_LABELS)` (7 roles including `director`, `center_head`)

### ✅ Issue 4: Mobile Responsive Tables (Partial)
- [DocumentsPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/DocumentsPage.jsx) — card layout on `<md`, table on `md+`
- [ApprovalsPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/ApprovalsPage.jsx) — same pattern

**Still needs the same treatment:**
- [UsersPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/UsersPage.jsx) — table at lines ~145-175
- [AuditLogsPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/AuditLogsPage.jsx) — table section

**Pattern to follow:** Look at DocumentsPage for the exact card+table dual layout. The pattern is:
```jsx
{items.length > 0 && (
  <>
    {/* Mobile card layout */}
    <div className="md:hidden space-y-3">
      {items.map((item) => (
        <Link/div card with rounded-xl border bg-surface p-4>
          <title + badge row>
          <metadata row>
        </Link/div>
      ))}
    </div>
    {/* Desktop table layout */}
    <div className="hidden md:block rounded-xl ...">
      <table>...</table>
    </div>
  </>
)}
```

### Build Status
- **`npx vite build` → 179 modules, 0 errors** ✅
- **`php artisan route:list | grep api/v1 | wc -l` → 44 routes**
- Changes are NOT yet committed

---

## Remaining Task: Commit the Fixes

```bash
cd ~/SAO-IS && git add -A && git commit -m "fix: light mode contrast, stale cache, role filters, mobile responsive

- Add 30+ semantic CSS variables for light/dark theme support
- Replace all hard-coded dark-only colors across 20+ files  
- Fix React Query cache: staleTime=0, refetchOnMount, invalidate documents list
- Use ROLE_LABELS keys for dynamic role filter pills (includes director, center_head)
- Add mobile card layout for Documents and Approvals pages
- Fix hover states to use CSS variables instead of bg-white/[0.02]"
```

---

## Phase 7: Center-Based Architecture (Approved, Not Implemented)

Full plan at: [implementation_plan.md](file:///home/joshu/.gemini/antigravity/brain/90a0eebf-6410-4b86-9d5a-bb2486a19f99/implementation_plan.md)

### Summary of Changes Needed:

#### Backend
1. **New migration: `create_centers_table`** — `id` (uuid), `code` (unique), `name`, `description`, `is_active`, timestamps
2. **Migration: `add_center_id_to_users`** — nullable FK to centers
3. **Migration: `add_center_id_to_document_types`** — nullable FK to centers
4. **Migration: `add_center_id_to_workflow_steps`** — nullable FK to centers
5. **New roles:** `director` and `center_head` (already in seeders & constants, just need middleware/routing awareness)
6. **Modify `WorkflowService`** — approval matching: role + center scope
7. **Modify `ApprovalController@queue`** — check center match
8. **Modify `DocumentController@index`** — center-scoped document visibility
9. **`CenterSeeder`** — CSAD, CSA, CSFA, CGC
10. **Updated demo users** — director, center heads for each center

#### Frontend
1. **`CentersPage`** already exists at [CentersPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/CentersPage.jsx)
2. **Modify `UsersPage`** — add center dropdown in create/edit form, center badge in table
3. **Modify `DocumentTypesPage`** — add center dropdown
4. **Modify `WorkflowBuilderPage` + `WorkflowEditPage`** — center selector per step
5. **Modify `Sidebar`** — center-head specific nav items
6. **Modify `DashboardPage`** — center-specific metrics

### Key Design Decisions (Already Approved by User)
- **Center = scope, not role.** `User = Role + Center(optional)`
- **Director vs Admin** — separate roles: director = SAO authority, admin = IT
- **Centers visible to students** — grouped in submit form
- **Cross-center docs** — single workflow with multi-center steps
- **CSA reports** — manual upload first (already has [ReportsPage.jsx](file:///home/joshu/SAO-IS/frontend/src/pages/ReportsPage.jsx))
- **Backward-compatible migration** — existing data gets `center_id = null`

---

## Phase 8: AI/LLM Integration (Plan Needed)

### Competition: 2026 iPeople Chairman's Prize for AI
- **Theme:** "Rethinking the Design of Universities in the Era of AI"
- **Awards:** PHP 10,000 (1st), PHP 5,000 (2nd)
- **Deadline:** June 25 (already passed — but system can still be submitted/presented)

### Judging Criteria:
| Criteria | Weight |
|---|---|
| **Impact and Results** — demonstrated improvement in operations, student experience | **40%** |
| **Innovation and Creativity** — novel AI application to real problem | **25%** |
| **Alignment to Theme** — rethinking university design with AI | **20%** |
| **Implementation Effort** — evidence of experimentation, learning, effective deployment | **10%** |
| **Quality of Presentation** — clarity, organization, completeness | **5%** |

### What the User Wants:
> "All options, actually. I want the LLM to help in ALL aspects without being intrusive. I want even MORE functionality beyond those 4 options that will really make this AI-powered."

### AI Feature Ideas (map these to competition criteria):

**High-Impact (prioritize — 40% weight):**
1. **AI Document Assistant Chatbot** — students ask "What's the status of my clearance?" or "What documents do I need?"
2. **Smart Document Routing** — LLM suggests workflows when admin creates document types
3. **Auto-Fill Form Helper** — students describe needs in natural language, system identifies correct type
4. **Report Summarization** — CSA uploads Excel → LLM generates summary for director dashboard

**Innovation Points (25% weight):**
5. **AI-Powered Document Analysis** — when a document is uploaded, LLM checks if it's the right type and complete
6. **Approval Recommendation** — LLM reviews document + history and suggests approve/reject with reasoning
7. **Natural Language Search** — "show me all pending scholarship applications from last month"
8. **Anomaly Detection** — flag unusual patterns (e.g., same document submitted multiple times, unusually long review times)
9. **Auto-Generated Notifications** — LLM writes context-aware notification messages instead of generic templates
10. **Meeting/Report Generation** — auto-generate weekly SAO performance reports from system data

**Theme Alignment (20% weight):**
11. **Predictive Analytics Dashboard** — predict peak times, estimate processing times, resource planning
12. **Student Journey Analytics** — AI tracks common document submission patterns per student lifecycle

**New Validated Feature Ideas (Based on User Feedback):**
13. **Local AI Content Drafter (Privacy-Ready):** A localized AI tool (like Ollama/Gemma) that staff can use to draft standard letters, certificates, and memos without sending PII/private student information to external online services.
14. **Automated Data Extraction & OCR Parsing:** AI to automatically extract data and text from uploaded documents (even poorly scanned or purely digitally filled ones) to reduce manual record-tracking and data entry.
15. **Automated Reporting & Data Analysis Engine:** AI-driven data analysis to assist with generating reports and keeping track of records, addressing a major pain point for SAO staff.
16. **Bilingual Accessibility Assistant:** AI-driven feature to summarize complex academic policies into plain English and Tagalog (since the school is in the Philippines).
*(Note: We will skip building an org recommender for students, as the school already uses Anthology Engage for this).*

### Technical Approach:
- **Model:** Google Gemma 4 (user mentioned it specifically — lightweight, runs on Raspberry Pi, but the Ubuntu server should handle `gemma3-4b` or larger easily)
- **Runtime:** Ollama (`ollama run gemma3:4b`) on the same Ubuntu server
- **Integration:** Laravel backend → HTTP to Ollama API → structured prompts → JSON responses
- **Frontend:** Chat widget component, AI suggestion badges, smart search bar

### Architecture:
```
React Frontend → Laravel API → Ollama (Gemma 4) running locally
                              ↕
                         MySQL Database
```

No external API costs. Data stays on-premises. Perfect for school LAN deployment.

---

## Codebase Quick Reference

### Key Directories
```
/home/joshu/SAO-IS/
├── backend/                  # Laravel 11
│   ├── app/Http/Controllers/Api/  # 11 controllers
│   ├── app/Models/           # Eloquent models with UUID PKs
│   ├── database/migrations/  # 16+ migrations
│   ├── database/seeders/     # Demo data
│   └── routes/api.php        # 44 API routes
├── frontend/                 # React + Vite + TailwindCSS v4
│   └── src/
│       ├── api/              # Axios API modules (12 files)
│       ├── components/       # layout/, ui/, dashboard/, documents/, workflow/
│       ├── context/          # AuthContext, ThemeContext
│       ├── hooks/            # React Query hooks
│       ├── pages/            # 17 page components + auth/
│       ├── utils/            # constants.js, formatters.js
│       ├── index.css         # Theme CSS variables (key file!)
│       └── main.jsx          # App entry with ThemeProvider
└── docs/                     # Architecture, API, user manuals, deployment
```

### Running the App
```bash
cd ~/SAO-IS/backend && php artisan serve --host=0.0.0.0  # Terminal 1
cd ~/SAO-IS/frontend && npm run dev                       # Terminal 2
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
```

### Test Accounts
| Role | Email | Password |
|---|---|---|
| Admin | `2022jfevasco@live.mcl.edu.ph` | `MMCLSAO2026` |
| Student | `student.demo@sao-is.local` | `MMCLSAO2026` |
| Staff | `staff.demo@sao-is.local` | `MMCLSAO2026` |
| Faculty | `faculty.demo@sao-is.local` | `MMCLSAO2026` |

### Theme System
- CSS variables in [index.css](file:///home/joshu/SAO-IS/frontend/src/index.css) — `:root` (light) and `.dark`
- [ThemeContext.jsx](file:///home/joshu/SAO-IS/frontend/src/context/ThemeContext.jsx) — toggle + localStorage + OS preference
- Sun/moon button in [Topbar.jsx](file:///home/joshu/SAO-IS/frontend/src/components/layout/Topbar.jsx)
- **Always use `var(--th-*)` for ANY color** — never hardcode Tailwind color classes

### API Auth
- Sanctum SPA cookie auth (NOT token-based)
- `statefulApi()` in `bootstrap/app.php`
- CSRF cookie required before login: `GET /sanctum/csrf-cookie`
