# HANDOFF

Date: 2026-03-02
Branch: main

## Done

1. Propaiclaw wrapper and command surface

- Added/updated `propai`/`propaiclaw` wrapper flows over OpenClaw.
- Added command mappings for `dashboard`/`ui`/`web`, `tui`/`chat`, and realtor-oriented helpers.
- Added tenant-aware WhatsApp group allowlist commands:
  - `groups list`
  - `groups allow`
  - `groups allow-all`
- Added account/agent scoping resolution for allowlist operations.
- Added name-based WhatsApp group discovery and resolver utilities.

2. Multi-tenant group allowlist safety

- Allowlist writes are now account-scoped.
- Group resolution supports explicit IDs, wildcard, exact-name, and contains-name matching.
- Added tests for allowlist and discovery behavior.

3. UI rebrand for realtor language

- Rebranded user-facing “Cron/Cron Jobs” wording to “Agent Tasks” in key dashboard surfaces.
- Updated visible session labels from `Cron:` to `Agent Task:` and normalized legacy labels.

4. Agent Tasks usability

- Added quick task templates for realtor use cases in the Agent Tasks form:
  - Listing Broadcast
  - Buyer Match Alerts
  - Lead Follow-up Plan
  - Group Engagement Pulse
  - Stale Lead Rescue
  - Weekly Broker Digest
- Templates prefill schedule, payload, and delivery defaults for fast setup.

5. Background open/close flicker mitigation

- Fixed duplicate history reload trigger from the Agent Tasks “History” button.
- Added debounced cron-event refresh (`300ms`) in gateway event handling.
- Switched cron-event refresh path to lightweight mode (skip channel/model suggestion refresh on event bursts).
- Made runs list ordering deterministic by current sort direction.

## Pending

Goal: staged path from wrapper model to a Propaiclaw-first runtime for realtor workflows (WhatsApp + Browser + Canvas + plugins), while preserving tenant continuity.

### Stage 0 - Scope lock and migration policy

1. Confirm bounded scope

- Channels/features in scope for independence: WhatsApp, Browser tools, Canvas host, plugin runtime.
- Out of scope for first cutover: non-realtor channels and non-essential platform surfaces.

2. Define compatibility policy

- Keep backward read compatibility for existing `.openclaw` state during migration.
- Keep legacy command/protocol aliases active until staged cutover is complete.

3. Establish acceptance gates

- No tenant data loss.
- No broker-facing command regression.
- Existing sessions/config continue to load.

### Stage 1 - User-facing rebrand completion (no runtime break)

1. Remove remaining user-facing `openclaw` text in Propaiclaw flows

- Help, examples, error hints, and wrapper diagnostics should show `propai`/`propaiclaw`.

2. Keep runtime internals unchanged for now

- Continue using current OpenClaw internals under the hood during this stage.

3. Add regression tests

- Tests for command output/help/error paths to ensure no user-facing brand leaks.

Stage 1 progress update (2026-03-02)

- done
  - Stage 1.1 first slice completed for user-facing wording in:
    - `README.md`
    - `src/propaiclaw-entry.ts`
    - `src/propai/mapper.ts`
    - `src/propai/mapper.test.ts`
  - Updated help/examples/error/debug-facing wording to use Propaiclaw/runtime terms (no user-facing `openclaw` text in this slice).
  - Kept wrapper execution path unchanged (`propaiclaw-entry` still launches `openclaw.mjs` internally).
  - Added mapper regression coverage to prevent help/failure brand leaks.

- pending
  - Stage 1 follow-up slices outside this first file set (if any additional user-facing surfaces are identified).
  - Later stages (Stage 2+) remain pending by plan.

- verification
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts`
    - Result: passed (`2` test files, `47` tests).
  - Command: `pnpm exec oxfmt --check README.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts`
    - Result: passed (all matched files correctly formatted).

Stage 1 progress update (2026-03-02, pass 2)

- done
  - Ran a wider Stage 1.1 leak pass across Propaiclaw-facing command/help/error surfaces in `README.md`, `src/propaiclaw-entry.ts`, and `src/propai/*`.
  - No additional user-facing `openclaw` leaks found in Propaiclaw command flows beyond first-slice fixes.
  - Added focused entrypoint message helpers and regression tests for:
    - debug runtime line
    - runtime launch failure line
    - runtime signal-exit line
    - config-invalid hint line
  - Wrapper execution path remains unchanged (still resolves and runs `openclaw.mjs`).

- pending
  - Any future Stage 1 text leaks outside currently scanned Propaiclaw surfaces (none identified in this pass).
  - Stage 2+ migration and identity work remains pending by plan.

- verification
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (`3` test files, `51` tests).
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts`
    - Result: passed (`2` test files, `47` tests).
  - Command: `pnpm exec oxfmt --check README.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts`
    - Result: passed (all matched files correctly formatted).
  - Command: `pnpm exec oxfmt --check README.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts src/propaiclaw-entry.messages.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (all matched files correctly formatted).

Stage 1 progress update (2026-03-02, pass 3)

- done
  - Completed an additional Stage 1 doc slice for Propaiclaw-facing skill guidance:
    - `docs/tools/skills.md`
  - Reworded user-facing brand references from OpenClaw to Propaiclaw in that document while preserving technical/runtime identifiers (for example `openclaw.json`, `metadata.openclaw`, and `~/.openclaw` paths).
  - No runtime behavior changes.

- pending
  - One remaining mixed-brand doc string was detected in `docs/channels/index.md` (`Propaiclaw/OpenClaw`) during the broader scan.
  - Runtime/internal compatibility identifiers containing `OPENCLAW_*` remain intentionally unchanged for Stage 2 compatibility policy.

- verification
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (`3` test files, `51` tests).
  - Command: `pnpm exec oxfmt --check docs/tools/skills.md README.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts src/propaiclaw-entry.messages.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (all matched files correctly formatted).

Stage 1 progress update (2026-03-02, pass 4)

- done
  - Removed remaining mixed-brand summary text in `docs/channels/index.md`:
    - `Propaiclaw/OpenClaw` -> `Propaiclaw`

- pending
  - Runtime/internal compatibility identifiers with `OPENCLAW_*` and `.openclaw` paths remain intentionally unchanged for Stage 2 compatibility policy.

- verification
  - Command: `pnpm exec oxfmt --check docs/channels/index.md`
    - Result: passed (file correctly formatted).

Stage 1 progress update (2026-03-02, pass 5, closeout)

- done
  - Completed an additional repo-wide Propaiclaw-facing brand scan for mixed `propai`/`propaiclaw` + `openclaw` strings.
  - No additional user-facing Stage 1 brand leaks were found in Propaiclaw command/help/error surfaces; remaining `openclaw` mentions are technical compatibility identifiers or internal wrapper references.
  - Stage 1 acceptance criteria remain satisfied:
    - Help/examples/errors in Propaiclaw flows do not leak `openclaw` user-facing text.
    - Wrapper execution path remains intact.
    - Regression tests remain green.

- pending
  - Stage 2+ bridge and migration work.

- verification
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (`3` test files, `51` tests).
  - Command: `pnpm exec oxfmt --check README.md docs/channels/index.md docs/tools/skills.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts src/propaiclaw-entry.messages.ts src/propaiclaw-entry.messages.test.ts`
    - Result: passed (all matched files correctly formatted).
  - Command: `pnpm test:install:smoke`
    - Result: failed in local environment (Docker unavailable: `docker` command not found in WSL distro).

### Stage 2 - Config and state namespace bridge

1. Introduce Propaiclaw canonical paths/envs

- Add canonical Propaiclaw config/state paths for new installs.
- Add Propaiclaw env aliases while continuing to honor legacy `OPENCLAW_*`.

2. Dual-read, single-write migration strategy

- Read both legacy and new locations.
- Write canonical Propaiclaw locations after migration.

3. Migration tooling

- Add explicit migration command flow (dry-run + apply).
- Emit clear per-tenant migration report.

Stage 2 progress update (2026-03-02, pass 1)

- done
  - Added Propaiclaw canonical env aliases with dual-read behavior while preserving legacy compatibility:
    - Home/state/config overrides now accept `PROPAICLAW_*` and legacy `OPENCLAW_*`.
    - Propaiclaw mode (`PROPAICLAW_MODE` / `OPENCLAW_PROPAICLAW_MODE`) now resolves canonical defaults under:
      - state dir: `~/.propaiclaw`
      - config file: `propaiclaw.json`
  - Added compatibility bridging in Propaiclaw wrapper child env:
    - Mirrors Propaiclaw and OpenClaw path/profile/port/channel envs to keep legacy code paths functional.
  - Added/updated tests for:
    - path resolution (`src/config/paths.test.ts`)
    - home dir aliasing (`src/infra/home-dir.test.ts`)
    - CLI profile env population (`src/cli/profile.test.ts`)
    - default realtor workspace resolution in Propaiclaw mode (`src/propai/realtor-workspace.test.ts`)
    - channel allowlist env precedence (`src/channels/registry.helpers.test.ts`)

- pending
  - Stage 2.2 dual-read/single-write migration write-path behavior.
  - Stage 2.3 explicit migration tooling and reporting.

- verification
  - Command: `pnpm exec vitest run src/config/paths.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts`
    - Result: passed (`5` test files, `56` tests).
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts src/config/paths.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts`
    - Result: passed (`8` test files, `107` tests).
  - Command: `pnpm exec oxfmt --check src/config/paths.ts src/infra/home-dir.ts src/utils.ts src/cli/profile.ts src/propai/realtor-workspace.ts src/propaiclaw-entry.ts src/channels/registry.ts src/config/paths.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts`
    - Result: passed (all matched files correctly formatted).

Stage 2 progress update (2026-03-02, pass 2)

- done
  - Implemented dual-read/single-write behavior for config I/O in Propaiclaw mode:
    - Config reads still resolve existing legacy/canonical candidates.
    - Config writes now target canonical path resolution by default (while preserving explicit config-path overrides).
  - Added canonical write-state helper path resolution for migration-safe writes.
  - Added regression coverage proving:
    - legacy config remains readable in Propaiclaw mode,
    - write operations persist to canonical `~/.propaiclaw/propaiclaw.json`,
    - legacy source config remains unchanged after canonical write.

- pending
  - Stage 2.3 explicit migration tooling and reporting.

- verification
  - Command: `pnpm exec vitest run src/config/paths.test.ts src/config/io.compat.test.ts src/config/io.write-config.test.ts`
    - Result: passed (`3` test files, `38` tests).
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts src/config/paths.test.ts src/config/io.compat.test.ts src/config/io.write-config.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts`
    - Result: passed (`10` test files, `130` tests).
  - Command: `pnpm exec oxfmt --check README.md src/propaiclaw-entry.ts src/propai/mapper.ts src/propai/mapper.test.ts src/config/paths.ts src/config/paths.test.ts src/config/io.ts src/config/io.compat.test.ts src/infra/home-dir.ts src/infra/home-dir.test.ts src/cli/profile.ts src/cli/profile.test.ts src/propai/realtor-workspace.ts src/propai/realtor-workspace.test.ts src/channels/registry.ts src/channels/registry.helpers.test.ts HANDOFF.md`
    - Result: passed (all matched files correctly formatted).

Stage 2 progress update (2026-03-02, pass 3)

- done
  - Added explicit state migration command flow:
    - `openclaw migrate-state --dry-run` (default behavior if no flags are passed)
    - `openclaw migrate-state --apply`
  - Added per-tenant migration reporting in command output (target agent/main key, state/oauth paths, and planned/applied changes).
  - Wired command into CLI registry and maintenance registration.
  - Updated command-path migration guard so `migrate-state` does not trigger implicit pre-migration via config guard.
  - Added regression tests for:
    - migrate-state command behavior (`src/commands/migrate-state.test.ts`)
    - maintenance command wiring (`src/cli/program/register.maintenance.test.ts`)
    - argv migration-path guard (`src/cli/argv.test.ts`)

- pending
  - Optional enhancement: machine-readable (`--json`) migration report output.
  - Stage 3+ work remains pending by plan.

- verification
  - Command: `pnpm exec vitest run src/commands/migrate-state.test.ts src/cli/program/register.maintenance.test.ts src/cli/argv.test.ts src/config/paths.test.ts src/config/io.compat.test.ts src/config/io.write-config.test.ts`
    - Result: passed (`6` test files, `83` tests).
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts src/config/paths.test.ts src/config/io.compat.test.ts src/config/io.write-config.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts src/commands/migrate-state.test.ts src/cli/program/register.maintenance.test.ts src/cli/argv.test.ts`
    - Result: passed (`13` test files, `175` tests).
  - Command: `pnpm exec oxfmt --check src/commands/migrate-state.ts src/commands/migrate-state.test.ts src/cli/program/register.maintenance.ts src/cli/program/register.maintenance.test.ts src/cli/program/command-registry.ts src/cli/argv.ts src/cli/argv.test.ts src/config/paths.ts src/config/paths.test.ts src/config/io.ts src/config/io.compat.test.ts scripts/test-install-sh-docker.sh HANDOFF.md`
    - Result: passed (all matched files correctly formatted).

### Stage 3 - Service identity bridge (daemon/runtime)

1. Add Propaiclaw service names and labels

- New service labels/names for launchd/systemd/windows task paths.

2. Backward service compatibility

- Status/restart/doctor flows detect and handle both legacy and new service identities.

3. Add cross-platform tests

- Service naming, detection, and restart behavior for profile and default modes.

Stage 3 progress update (2026-03-02, pass 1)

- done
  - CI polish applied for install smoke PR stability:
    - `.github/workflows/install-smoke.yml` now uses `cancel-in-progress: false` to avoid auto-cancelling in-flight smoke runs on new PR commits.

- pending
  - Stage 3 service identity bridge implementation and cross-platform service tests.

Stage 3 progress update (2026-03-02, pass 2)

- done
  - Added local install-smoke Docker preflight in `scripts/test-install-sh-docker.sh`:
    - Fails fast with clear actionable messages when Docker CLI/daemon are unavailable.
    - Prevents opaque smoke failures from long-running build steps when Docker is down.

- pending
  - Stage 3 service identity bridge implementation and cross-platform service tests.

- verification
  - Command: `bash scripts/test-install-sh-docker.sh`
    - Result: fails fast in current environment with preflight message:
      - `ERROR: docker daemon is not reachable.`
      - `Start Docker Desktop (or docker engine) and retry.`

Stage 3 progress update (2026-03-02, pass 3)

- done
  - Long-term smoke workflow split implemented:
    - Local optional smoke: `pnpm test:install:smoke` -> `test:install:smoke:local` (skips cleanly when Docker is unavailable).
    - Strict smoke: `pnpm test:install:smoke:strict` (required Docker; fails fast on missing/unreachable daemon).
  - CI workflow hardened as source-of-truth:
    - `install-smoke.yml` now includes nightly schedule trigger.
    - `workflow_dispatch` now supports `full` input for full installer smoke.
    - CI job now always uses strict smoke command (`pnpm test:install:smoke:strict`).
    - Nightly/manual-full runs enable CLI + previous-version smoke checks (heavier coverage).
  - Added remote smoke control helpers:
    - `pnpm test:install:smoke:ci:dispatch` (dispatch install-smoke workflow).
    - `pnpm test:install:smoke:ci:status` (list recent install-smoke runs).

- pending
  - Optional future CI enhancement: split nightly smoke into a larger explicit matrix job.
  - Branch protection settings are repository-admin configuration (outside codebase).

- verification
  - Command: `pnpm exec vitest run src/cli/program/command-registry.test.ts src/cli/program/register.maintenance.test.ts src/cli/argv.test.ts src/commands/migrate-state.test.ts`
    - Result: passed (`4` test files, `54` tests).
  - Command: `pnpm exec vitest run src/propai/mapper.test.ts src/propai/packaging.test.ts src/propaiclaw-entry.messages.test.ts src/config/paths.test.ts src/config/io.compat.test.ts src/config/io.write-config.test.ts src/infra/home-dir.test.ts src/cli/profile.test.ts src/propai/realtor-workspace.test.ts src/channels/registry.helpers.test.ts src/commands/migrate-state.test.ts src/cli/program/register.maintenance.test.ts src/cli/program/command-registry.test.ts src/cli/argv.test.ts`
    - Result: passed (`14` test files, `184` tests).
  - Command: `bash scripts/test-install-sh-local.sh`
    - Result: passed with expected local-skip message when Docker daemon unavailable.
  - Command: `bash scripts/test-install-sh-docker.sh`
    - Result: failed fast as expected with strict preflight message when Docker daemon unavailable.
  - Command: `node scripts/install-smoke-ci.mjs status --repo vishalgojha/propaiclaw --limit 3`
    - Result: passed; listed recent install-smoke workflow runs.
  - Command: `pnpm exec oxfmt --check src/cli/program/command-registry.ts src/cli/program/command-registry.test.ts src/cli/program/register.maintenance.ts src/cli/program/register.maintenance.test.ts src/cli/argv.ts src/cli/argv.test.ts src/commands/migrate-state.ts src/commands/migrate-state.test.ts scripts/install-smoke-ci.mjs package.json HANDOFF.md`
    - Result: passed (all matched files correctly formatted).

### Stage 4 - External protocol compatibility layer

1. Header/token aliases

- Accept both legacy and new auth headers.
- Prefer Propaiclaw naming in docs/output.

2. Deep-link and canvas aliasing

- Support both legacy and Propaiclaw URI schemes during transition.

3. Transport tests

- Verify webhooks/hooks/control paths across both naming conventions.

Stage 4 progress update (2026-03-02, pass 1)

- done
  - Added gateway header aliases while preserving legacy compatibility:
    - Hook auth accepts `x-propaiclaw-token` and legacy `x-openclaw-token` (`Authorization: Bearer` remains preferred).
    - OpenAI/OpenResponses routing accepts `x-propaiclaw-agent-id` / `x-propaiclaw-session-key` alongside legacy headers.
    - Agent model routing now accepts `propaiclaw:<agentId>` alongside `openclaw:<agentId>` and `agent:<agentId>`.
    - `/tools/invoke` now accepts `x-propaiclaw-message-channel`, `x-propaiclaw-account-id`, `x-propaiclaw-message-to`, and `x-propaiclaw-thread-id` with legacy fallback.
  - Updated webhook query-token rejection text to prefer `X-Propaiclaw-Token` while retaining legacy `X-OpenClaw-Token`.
  - Updated Stage 4 docs to prefer Propaiclaw naming for headers/examples while documenting legacy aliases:
    - `docs/automation/webhook.md`
    - `docs/gateway/openai-http-api.md`
    - `docs/gateway/openresponses-http-api.md`
    - `docs/gateway/configuration-reference.md`
  - Added targeted regression coverage for hook token header alias precedence:
    - `src/gateway/hooks.header-alias.test.ts`

- pending
  - Stage 4.2 deep-link and canvas URI/path aliasing.
  - Stage 4.3 broader transport coverage across remaining compatibility surfaces.
  - Optional docs follow-up: non-English mirror pages for propaiclaw-first header examples.

- verification
  - Command: `pnpm exec vitest run src/gateway/hooks.header-alias.test.ts src/gateway/openai-http.test.ts src/gateway/openresponses-http.test.ts src/gateway/server.hooks.test.ts src/gateway/tools-invoke-http.test.ts`
    - Result: passed (`5` test files, `32` tests).
  - Command: `pnpm exec oxfmt --check docs/automation/webhook.md docs/gateway/configuration-reference.md docs/gateway/openai-http-api.md docs/gateway/openresponses-http-api.md src/gateway/hooks.ts src/gateway/http-utils.ts src/gateway/hooks.header-alias.test.ts src/gateway/openai-http.test.ts src/gateway/openresponses-http.test.ts src/gateway/server-http.ts src/gateway/server.hooks.test.ts src/gateway/tools-invoke-http.ts src/gateway/tools-invoke-http.test.ts`
    - Result: passed (all matched files correctly formatted).

Stage 4 progress update (2026-03-02, pass 2)

- done
  - Added deep-link dual-scheme compatibility for transition:
    - `DeepLinkParser` now accepts both `openclaw://` and `propaiclaw://`.
    - iOS and macOS canvas WebView delegates now intercept both schemes.
    - iOS and macOS app URL scheme registration now includes `propaiclaw` alongside `openclaw`.
  - Added canvas path alias compatibility while keeping canonical output unchanged:
    - A2UI/canvas/ws request matching now accepts both `__openclaw__` and `__propaiclaw__` path prefixes.
    - Scoped capability URL normalization now accepts both `/__openclaw__/cap/...` and `/__propaiclaw__/cap/...`.
    - Scoped URL generation remains canonical on `/__openclaw__/cap/...` to avoid changing existing output contracts.
  - Added regression coverage for Stage 4.2 aliasing:
    - `src/gateway/canvas-capability.alias.test.ts` (new).
    - Extended `src/canvas-host/server.test.ts` and `src/gateway/server.canvas-auth.test.ts` for `propaiclaw` alias routes.
    - Added `propaiclaw://` deep-link parsing tests in iOS/OpenClawKit test suites.

- pending
  - Stage 4.3 broader transport coverage across remaining compatibility surfaces.
  - Optional docs follow-up: non-English mirror pages for propaiclaw-first header examples.

- verification
  - Command: `pnpm exec vitest run src/canvas-host/server.test.ts src/gateway/server.canvas-auth.test.ts src/gateway/canvas-capability.alias.test.ts src/gateway/server-methods/nodes.canvas-capability-refresh.test.ts`
    - Result: passed (`4` test files, `16` tests).
  - Command: `pnpm exec oxfmt --check src/canvas-host/a2ui.ts src/canvas-host/server.ts src/canvas-host/server.test.ts src/gateway/canvas-capability.ts src/gateway/canvas-capability.alias.test.ts src/gateway/server-http.ts src/gateway/server.canvas-auth.test.ts HANDOFF.md`
    - Result: passed (all matched files correctly formatted).
  - Command: `swift --version`
    - Result: failed (`swift` is not installed in this Windows environment), so Swift/iOS/macOS tests were not run here.

Stage 4 progress update (2026-03-02, pass 3)

- done
  - Expanded external transport compatibility coverage across remaining HTTP surfaces:
    - OpenAI and OpenResponses HTTP tests now cover legacy `x-openclaw-session-key`, preferred `x-propaiclaw-session-key`, and precedence when both are present.
    - Hooks HTTP integration test now verifies token-header precedence when both `x-propaiclaw-token` and `x-openclaw-token` are sent.
    - `/tools/invoke` tests now cover `x-openclaw-message-channel` / `x-openclaw-account-id` legacy behavior and preferred `x-propaiclaw-*` precedence when both aliases are present.
  - Updated gateway transport docs to reflect propaiclaw-first compatibility on remaining surfaces:
    - `docs/gateway/tools-invoke-http-api.md` now documents preferred `x-propaiclaw-*` headers plus legacy aliases.
    - Canvas transport docs now list preferred `__propaiclaw__` paths with legacy `__openclaw__` aliases in:
      - `docs/gateway/network-model.md`
      - `docs/gateway/security/index.md`

- pending
  - Optional docs follow-up: non-English mirror pages for propaiclaw-first transport examples.

- verification
  - Command: `pnpm exec vitest run src/gateway/openai-http.test.ts src/gateway/openresponses-http.test.ts src/gateway/tools-invoke-http.test.ts src/gateway/server.hooks.test.ts`
    - Result: passed (`4` test files, `31` tests).
  - Command: `pnpm exec oxfmt --check src/gateway/openai-http.test.ts src/gateway/openresponses-http.test.ts src/gateway/tools-invoke-http.test.ts src/gateway/server.hooks.test.ts docs/gateway/tools-invoke-http-api.md docs/gateway/configuration-reference.md docs/gateway/network-model.md docs/gateway/security/index.md HANDOFF.md`
    - Result: passed (all matched files correctly formatted).

### Stage 5 - Plugin SDK and extension contract bridge

1. SDK alias strategy

- Provide Propaiclaw SDK import path while preserving existing `openclaw/plugin-sdk` compatibility.

2. Extension loading checks

- Ensure bundled and external plugins load under both import namespaces.

3. Migration notes for plugin authors

- Publish concise compatibility guidance and timeline.

### Stage 6 - Realtor UX hardening and command simplification

1. Simplify high-frequency realtor actions

- Keep `groups allow`, `lead follow-up`, `schedule daily`, `sync`, `start` as minimal-path commands.

2. Agent Tasks polish

- Add tenant presets and safer defaults for account/agent/channel.
- Finish i18n coverage for newly added templates and labels.

3. Stability validation

- Re-test UI under high event throughput to confirm no open/close flicker recurrence.

### Stage 7 - Tenant migration rollout

1. Pilot rollout

- Migrate a small set of realtor tenants first with audit logs enabled.

2. Full rollout

- Expand migration in batches after pilot pass criteria.

3. Rollback path

- Keep reversible mapping for config/service identity in case of live failures.

### Stage 8 - Cutover and deprecation

1. Default to Propaiclaw runtime identity for new installs

- Legacy names remain accepted for a deprecation window.

2. Deprecation messaging

- Emit warnings for legacy paths/flags with clear migration guidance.

3. Final cleanup

- Remove legacy-only code after deprecation window and stability period.

## Verification run

- `pnpm --dir ui test -- src/ui/views/cron.test.ts src/ui/app-gateway.node.test.ts`
- `pnpm --dir ui test -- src/ui/views/cron.test.ts`
- `pnpm exec oxfmt --check ui/src/ui/views/cron.ts ui/src/ui/views/cron.test.ts ui/src/i18n/locales/en.ts`
- `pnpm exec oxfmt --check ui/src/ui/app-settings.ts ui/src/ui/app-gateway.ts ui/src/ui/app-gateway.node.test.ts`

All above passed at handoff time.
