import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { OpenClawConfig } from "../config/config.js";
import { loadConfig } from "../config/config.js";
import { resolveLegacyStateDirs, resolveNewStateDir } from "../config/paths.js";
import type { RuntimeEnv } from "../runtime.js";
import {
  autoMigrateLegacyStateDir,
  detectLegacyStateMigrations,
  runLegacyStateMigrations,
} from "./doctor-state-migrations.js";

export type MigrateStateOptions = {
  dryRun?: boolean;
  apply?: boolean;
};

type StateDirPlan = {
  legacyDir: string;
  targetDir: string;
  status: "planned" | "skipped-target-exists" | "skipped-env-override";
  reason?: string;
};

function resolveDryRun(opts: MigrateStateOptions): boolean {
  if (opts.apply && opts.dryRun) {
    throw new Error("Use either --dry-run or --apply, not both.");
  }
  if (opts.apply) {
    return false;
  }
  return true;
}

function resolveStateDirPlan(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): StateDirPlan | null {
  const stateOverride =
    env.PROPAICLAW_STATE_DIR?.trim() ??
    env.OPENCLAW_STATE_DIR?.trim() ??
    env.CLAWDBOT_STATE_DIR?.trim();
  const targetDir = resolveNewStateDir(homedir, env);
  const legacyDir = resolveLegacyStateDirs(homedir, env).find((dir) => {
    try {
      return fs.existsSync(dir);
    } catch {
      return false;
    }
  });

  if (!legacyDir) {
    return null;
  }
  if (stateOverride) {
    return {
      legacyDir,
      targetDir,
      status: "skipped-env-override",
      reason: `OPENCLAW_STATE_DIR is set to ${stateOverride}`,
    };
  }
  if (path.resolve(legacyDir) === path.resolve(targetDir)) {
    return null;
  }
  if (fs.existsSync(targetDir)) {
    return {
      legacyDir,
      targetDir,
      status: "skipped-target-exists",
      reason: `target already exists: ${targetDir}`,
    };
  }
  return {
    legacyDir,
    targetDir,
    status: "planned",
  };
}

function reportDetectionSummary(params: {
  runtime: RuntimeEnv;
  cfg: OpenClawConfig;
  stateDirPlan: StateDirPlan | null;
  detection: Awaited<ReturnType<typeof detectLegacyStateMigrations>>;
}) {
  const { runtime, cfg, stateDirPlan, detection } = params;
  const scope = cfg.session?.scope ?? "dm";
  runtime.log("Legacy state migration report:");
  runtime.log(`- target agent: ${detection.targetAgentId}`);
  runtime.log(`- target main key: ${detection.targetMainKey}`);
  runtime.log(`- session scope: ${scope}`);
  runtime.log(`- state dir: ${detection.stateDir}`);
  runtime.log(`- oauth dir: ${detection.oauthDir}`);
  if (stateDirPlan) {
    if (stateDirPlan.status === "planned") {
      runtime.log(
        `- state dir move planned: ${stateDirPlan.legacyDir} -> ${stateDirPlan.targetDir}`,
      );
    } else {
      runtime.log(
        `- state dir move skipped: ${stateDirPlan.legacyDir} -> ${stateDirPlan.targetDir} (${stateDirPlan.reason ?? stateDirPlan.status})`,
      );
    }
  }
}

export async function migrateStateCommand(
  runtime: RuntimeEnv,
  opts: MigrateStateOptions = {},
): Promise<void> {
  const dryRun = resolveDryRun(opts);
  const cfg = loadConfig();
  const stateDirPlan = resolveStateDirPlan();
  const detected = await detectLegacyStateMigrations({ cfg });
  reportDetectionSummary({ runtime, cfg, stateDirPlan, detection: detected });

  if (dryRun) {
    const preview = [];
    if (stateDirPlan?.status === "planned") {
      preview.push(`State dir: ${stateDirPlan.legacyDir} -> ${stateDirPlan.targetDir}`);
    }
    preview.push(...detected.preview);
    if (preview.length === 0) {
      runtime.log("Dry run: no migration actions detected.");
      return;
    }
    runtime.log("Dry run actions:");
    for (const entry of preview) {
      runtime.log(entry.startsWith("- ") ? entry : `- ${entry}`);
    }
    return;
  }

  const stateDirResult = await autoMigrateLegacyStateDir({ env: process.env });
  const applyDetection = await detectLegacyStateMigrations({ cfg });
  const migrationResult = await runLegacyStateMigrations({
    detected: applyDetection,
  });
  const changes = [...stateDirResult.changes, ...migrationResult.changes];
  const warnings = [...stateDirResult.warnings, ...migrationResult.warnings];

  if (changes.length === 0) {
    runtime.log("Apply: no migration changes were required.");
  } else {
    runtime.log("Apply changes:");
    for (const entry of changes) {
      runtime.log(`- ${entry}`);
    }
  }
  if (warnings.length > 0) {
    runtime.log("Apply warnings:");
    for (const entry of warnings) {
      runtime.log(`- ${entry}`);
    }
  }
}
