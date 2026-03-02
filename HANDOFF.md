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

### Stage 3 - Service identity bridge (daemon/runtime)

1. Add Propaiclaw service names and labels

- New service labels/names for launchd/systemd/windows task paths.

2. Backward service compatibility

- Status/restart/doctor flows detect and handle both legacy and new service identities.

3. Add cross-platform tests

- Service naming, detection, and restart behavior for profile and default modes.

### Stage 4 - External protocol compatibility layer

1. Header/token aliases

- Accept both legacy and new auth headers.
- Prefer Propaiclaw naming in docs/output.

2. Deep-link and canvas aliasing

- Support both legacy and Propaiclaw URI schemes during transition.

3. Transport tests

- Verify webhooks/hooks/control paths across both naming conventions.

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
