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

1. Live validation in target realtor environment

- Confirm no remaining rapid open/close behavior under real cron-event volume and active chat/tool stream traffic.

2. Localization follow-up

- New template strings are currently added in English locale; mirror into other locales if needed.

3. Optional product polish

- Add per-template tenant presets (default account/agent/channel) if brokers require one-click tenant-aware provisioning.
- Consider moving remaining hardcoded advanced-form labels to i18n keys for consistency.

## Verification run

- `pnpm --dir ui test -- src/ui/views/cron.test.ts src/ui/app-gateway.node.test.ts`
- `pnpm --dir ui test -- src/ui/views/cron.test.ts`
- `pnpm exec oxfmt --check ui/src/ui/views/cron.ts ui/src/ui/views/cron.test.ts ui/src/i18n/locales/en.ts`
- `pnpm exec oxfmt --check ui/src/ui/app-settings.ts ui/src/ui/app-gateway.ts ui/src/ui/app-gateway.node.test.ts`

All above passed at handoff time.
