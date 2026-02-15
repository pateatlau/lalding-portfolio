# Plan: Optimize CI Pipeline and Add CD for Vercel Production Deployment

## Context

The CI pipeline at `.github/workflows/ci.yml` has suboptimal job dependencies that serialize work unnecessarily, adding ~4 minutes of wasted wall time. Additionally, the deploy job for Vercel production deployments is commented out. Now that the Vercel secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID) are configured in the GitHub repo, we can enable automated production deployments gated behind CI.

## Files to Modify

| File                       | Action | Description                                      |
| -------------------------- | ------ | ------------------------------------------------ |
| `.github/workflows/ci.yml` | Edit   | Fix job dependencies + uncomment deploy job      |
| `vercel.json`              | Create | Disable Vercel auto-deploy on main               |
| `CLAUDE.md`                | Edit   | Remove deployment TODO, update CI/CD description |

## Step 1: Create feature branch

```bash
git checkout main && git checkout -b feature/ci-cd-optimization
```

## Step 2: Fix CI job dependencies in `ci.yml`

**Current dependency graph** (sequential bottleneck):

```
lint → test → e2e
lint → test → build → lighthouse
```

Wall time: ~10 min (test, e2e, and build run sequentially)

**New dependency graph** (parallel after lint):

```
lint ─┬─→ build ──→ lighthouse (PR only)
      ├─→ test
      └─→ e2e
```

Wall time: ~6 min (test, e2e, and build run in parallel)

**Changes:**

| Job     | Current `needs` | New `needs` | Reason                                   |
| ------- | --------------- | ----------- | ---------------------------------------- |
| `test`  | `lint`          | `lint`      | Already correct                          |
| `e2e`   | `test`          | `lint`      | E2E tests are independent of unit tests  |
| `build` | `[lint, test]`  | `lint`      | Build only needs lint to pass, not tests |

## Step 3: Uncomment and update deploy job in `ci.yml`

Replace the commented-out deploy block (lines 159–182) with:

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [lint, test, e2e, build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  environment:
    name: production
    url: https://lalding.in
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

Key points:

- `needs: [lint, test, e2e, build]` — gates deploy behind **all** CI jobs
- `if` condition ensures it only runs on pushes to main (not PRs)
- Uses `environment: production` with URL for GitHub deployment tracking

## Step 4: Create `vercel.json`

New file at project root:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

This disables Vercel's automatic deployment on main pushes (so deploys only happen through our CI/CD pipeline after all gates pass), while keeping PR preview deployments active for other branches.

## Step 5: Update `CLAUDE.md`

**1. Remove the TODOs section** (lines 129–143) — the "CI/CD: Enable Vercel Deployment" TODO with setup instructions, since it's now done. Also remove the `---` separator above it.

**2. Update the CI/CD description** in the Git Workflow section (lines 112–116).

Change from:

```markdown
- Lint → Build pipeline
- Lighthouse CI for performance audits on PRs
- Deploy job (currently disabled - see TODO below)
```

To:

```markdown
- Lint → parallel Build, Test, E2E pipeline
- Lighthouse CI for performance audits on PRs
- Automated Vercel production deployment on main (gated behind all CI jobs)
```

## Verification Checklist

- [ ] YAML syntax is well-formed (correct indentation in ci.yml)
- [ ] JSON syntax is valid (vercel.json)
- [ ] Job dependency graph matches the target parallel structure:
  - `lint`: no dependencies
  - `test`: needs lint
  - `e2e`: needs lint
  - `build`: needs lint
  - `lighthouse`: needs build, PR-only
  - `deploy`: needs [lint, test, e2e, build], main push only
- [ ] CLAUDE.md TODO section is fully removed
- [ ] CLAUDE.md CI/CD description accurately reflects the new pipeline
