# Propaiclaw

Propaiclaw is a WhatsApp-first realtor CLI built as a clean wrapper with realtor-focused defaults.

It translates business-focused commands into runtime commands, keeps defaults tuned for realtor workflows, and ships with bundled lead-management skills.

## Install

Runtime: Node 22+

```bash
npm install -g propaiclaw@latest
# or
pnpm add -g propaiclaw@latest
```

## Quick Start

```bash
propai profile init "Acme Realty" --owner "Vishal" --city "Mumbai"
propai sync
propai start
propai connect whatsapp
propai status
```

## Daily Workflow Examples

```bash
propai dashboard
propai tui
propai lead follow-up +15555550123 "Just checking in on the listing you asked about."
propai schedule daily "Good morning check-in" --to +15555550123
propai history +15555550123
```

## WhatsApp Group Allowlist (Simple)

```bash
propai groups list --account tenant-a --agent main
propai groups allow "Family Investors" --account tenant-a --agent main
propai groups allow 120000000000001@g.us 120000000000002@g.us --account tenant-a --agent main
propai groups allow-all --account tenant-a --agent main
```

Run `propai --help` for the complete command list.

Use `propai --debug ...` to print the underlying runtime command and full diagnostics.
`propaiclaw` is also available as a compatibility alias.

## What Propaiclaw Wraps

Propaiclaw keeps the wrapper-based runtime path under the hood and maps commands like:

- `propai start` -> `gateway run`
- `propai sync` -> `onboard --flow quickstart --skip-ui`
- `propai connect whatsapp` -> `channels login --channel whatsapp`
- `propai lead follow-up ...` -> `message send ... --channel whatsapp`

## Bundled Skills (Realtor Context)

When Propaiclaw mode is enabled, bundled skill loading defaults to:

- `message-parser`
- `lead-extractor`
- `india-location-normalizer`
- `summary-generator`
- `action-suggester`
- `lead-storage`

## Configuration and Docs

Propaiclaw uses the current configuration/runtime model.

- Getting started: docs/start/getting-started.md
- Gateway configuration: docs/gateway/configuration.md
- WhatsApp channel docs: docs/channels/whatsapp.md
- Skills docs: docs/tools/skills.md

## Development

```bash
git clone https://github.com/vishalgojha/propaiclaw.git
cd propaiclaw
pnpm install
pnpm build
pnpm test
```

## License

MIT
