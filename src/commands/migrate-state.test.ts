import { beforeEach, describe, expect, it, vi } from "vitest";

const loadConfig = vi.fn(() => ({}));
const autoMigrateLegacyStateDir = vi.fn();
const detectLegacyStateMigrations = vi.fn();
const runLegacyStateMigrations = vi.fn();

vi.mock("../config/config.js", () => ({
  loadConfig,
}));

vi.mock("./doctor-state-migrations.js", () => ({
  autoMigrateLegacyStateDir,
  detectLegacyStateMigrations,
  runLegacyStateMigrations,
}));

const { migrateStateCommand } = await import("./migrate-state.js");

function createRuntime() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  };
}

function createDetection() {
  return {
    targetAgentId: "main",
    targetMainKey: "main",
    targetScope: "dm",
    stateDir: "/tmp/state",
    oauthDir: "/tmp/state/credentials",
    sessions: {
      legacyDir: "/tmp/state/sessions",
      legacyStorePath: "/tmp/state/sessions/sessions.json",
      targetDir: "/tmp/state/agents/main/sessions",
      targetStorePath: "/tmp/state/agents/main/sessions/sessions.json",
      hasLegacy: true,
      legacyKeys: [],
    },
    agentDir: {
      legacyDir: "/tmp/state/agent",
      targetDir: "/tmp/state/agents/main/agent",
      hasLegacy: true,
    },
    whatsappAuth: {
      legacyDir: "/tmp/state/credentials",
      targetDir: "/tmp/state/credentials/whatsapp/default",
      hasLegacy: true,
    },
    pairingAllowFrom: {
      legacyTelegramPath: "/tmp/state/credentials/telegram-allowFrom.json",
      targetTelegramPath: "/tmp/state/credentials/telegram-default-allowFrom.json",
      hasLegacyTelegram: true,
    },
    preview: [
      "- Sessions: /tmp/state/sessions -> /tmp/state/agents/main/sessions",
      "- Agent dir: /tmp/state/agent -> /tmp/state/agents/main/agent",
    ],
  };
}

describe("migrateStateCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadConfig.mockReturnValue({});
    detectLegacyStateMigrations.mockResolvedValue(createDetection());
    autoMigrateLegacyStateDir.mockResolvedValue({
      migrated: false,
      skipped: false,
      changes: [],
      warnings: [],
    });
    runLegacyStateMigrations.mockResolvedValue({
      changes: [],
      warnings: [],
    });
  });

  it("runs dry-run by default and does not apply mutations", async () => {
    const runtime = createRuntime();
    await migrateStateCommand(runtime);

    expect(detectLegacyStateMigrations).toHaveBeenCalledTimes(1);
    expect(autoMigrateLegacyStateDir).not.toHaveBeenCalled();
    expect(runLegacyStateMigrations).not.toHaveBeenCalled();
    const output = runtime.log.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Legacy state migration report:");
    expect(output).toContain("Dry run actions:");
  });

  it("applies migration when --apply is set", async () => {
    const runtime = createRuntime();
    autoMigrateLegacyStateDir.mockResolvedValue({
      migrated: true,
      skipped: false,
      changes: ["State dir: /tmp/.openclaw -> /tmp/.propaiclaw"],
      warnings: [],
    });
    runLegacyStateMigrations.mockResolvedValue({
      changes: ["Merged sessions store -> /tmp/state/agents/main/sessions/sessions.json"],
      warnings: ["Left legacy sessions at /tmp/state/sessions.legacy-123"],
    });

    await migrateStateCommand(runtime, { apply: true });

    expect(detectLegacyStateMigrations).toHaveBeenCalledTimes(2);
    expect(autoMigrateLegacyStateDir).toHaveBeenCalledTimes(1);
    expect(runLegacyStateMigrations).toHaveBeenCalledTimes(1);
    const output = runtime.log.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Apply changes:");
    expect(output).toContain("Apply warnings:");
  });

  it("rejects conflicting --dry-run and --apply flags", async () => {
    const runtime = createRuntime();
    await expect(migrateStateCommand(runtime, { dryRun: true, apply: true })).rejects.toThrow(
      "Use either --dry-run or --apply, not both.",
    );
  });
});
