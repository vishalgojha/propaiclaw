# HANDOFF

## Project
- Wrapper product: **PropAi Sync** (built on OpenClaw).
- Goal in this branch: realtor-first CLI language + bundled lead pipeline skills so a fresh clone is reusable without extra skill config.

## Git State
- Repo path: `C:\Users\visha\openclaw`
- Branch: `feat/propai-sync-wrapper`
- Head commit: `f4a3f4029` (`feat(propai): add realtor wrapper CLI and bundled lead pipeline skills`)
- Tracking: `origin/feat/propai-sync-wrapper`
- Remotes:
  - `origin`: `https://github.com/vishalgojha/propaiclaw.git`
  - `upstream`: `https://github.com/openclaw/openclaw.git`

## What Was Completed
- Added **PropAi wrapper CLI** binary:
  - `propai.mjs`
  - `package.json` (`bin.propai`)
  - build wiring in `tsdown.config.ts` for `src/propai-entry.ts`
- Added command-mapping layer:
  - `src/propai/mapper.ts`
  - `src/propai/mapper.test.ts`
  - `src/propai-entry.ts`
- Added PropAi wrapper docs:
  - `README.md` (PropAi Sync wrapper section)
- Bundled six lead pipeline skills into repo `skills/`:
  - `message-parser`
  - `lead-extractor`
  - `india-location-normalizer`
  - `summary-generator`
  - `action-suggester`
  - `lead-storage`
- Added bundled-skills regression test:
  - `src/agents/skills.propai-bundled.test.ts`
- Updated skills docs for PropAi Sync wording:
  - `docs/tools/skills.md`
- Appended expanded operating rules content in:
  - `AGENTS.md`

## Validation Status
- Structural checks passed (files present, mapping logic reviewed).
- Test execution is still pending in this environment:
  - `pnpm` not found on PATH.
  - `npm exec vitest ...` failed due registry/network/permission (`EACCES`) while trying to fetch `vitest`.

## Known Notes / Risks
- Push succeeded, but GitHub warned about a large tracked file:
  - `.serena/cache/typescript/document_symbols.pkl` (~83 MB, above recommended 50 MB).
- Wrapper currently maps common realtor verbs; future expansion likely needed for richer lead/listing workflows.

## Suggested Next Steps
1. Install dependencies and run focused tests:
   - `pnpm install`
   - `pnpm exec vitest run src/propai/mapper.test.ts src/agents/skills.propai-bundled.test.ts`
2. Smoke-test CLI behavior locally:
   - `node propai.mjs --help`
   - `node propai.mjs start --debug`
   - `node propai.mjs connect whatsapp --debug`
3. Open/continue PR from:
   - `https://github.com/vishalgojha/propaiclaw/compare/main...feat/propai-sync-wrapper?expand=1`

## Branch Sync Commands
- Update from upstream later:
  - `git fetch upstream`
  - `git checkout main`
  - `git merge upstream/main`
  - `git checkout feat/propai-sync-wrapper`
  - `git rebase main`
