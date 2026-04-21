# Phase 1 Commit Plan (Conventional Commits)

Date: 2026-04-21
Branch: feature/phase-1-scaffold

This plan splits Phase 1 into reviewable commits without committing to main.

## Commit 1 - Backend scaffold and schema

Message:

```text
feat(phase1-backend): scaffold laravel app, schema, and seeders [Phase 1]
```

Stage suggestion:

```bash
git add backend/
```

Contents:
- Laravel backend scaffold
- Migrations for users/workflows/documents/approvals/audit/notifications
- Seeders, including RoleSeeder and AdminUserSeeder
- Backend configuration and route placeholders

## Commit 2 - Frontend scaffold and base app shell

Message:

```text
feat(phase1-frontend): scaffold react vite app with baseline routing and auth context [Phase 1]
```

Stage suggestion:

```bash
git add frontend/
```

Contents:
- React + Vite project scaffold
- Base routing, login page placeholder, API client setup
- Shared utility/components skeletons

## Commit 3 - Deployment docs, scripts, and signoff artifacts

Message:

```text
docs(phase1): add deployment scripts, checklist, and verification runbook [Phase 1]
```

Stage suggestion:

```bash
git add docs/ scripts/ .gitignore README.md
```

Contents:
- Deployment and architecture/database/user-manual placeholders
- backup.sh and deploy-frontend.sh
- Phase 1 signoff and Windows verification runbook
- .gitignore hardening for uploaded documents path

## Recommended Sequence

```bash
# commit 1
git add backend/
git commit -m "feat(phase1-backend): scaffold laravel app, schema, and seeders [Phase 1]"

# commit 2
git add frontend/
git commit -m "feat(phase1-frontend): scaffold react vite app with baseline routing and auth context [Phase 1]"

# commit 3
git add docs/ scripts/ .gitignore README.md
git commit -m "docs(phase1): add deployment scripts, checklist, and verification runbook [Phase 1]"
```

## Push and PR

```bash
git push -u origin feature/phase-1-scaffold
```

Then open a PR into main when the remote main branch/ref exists and branch protection policy is in place.
