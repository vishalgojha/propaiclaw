#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { listAgentIds, resolveDefaultAgentId } from "./agents/agent-scope.js";
import {
  readConfigFileSnapshot,
  readConfigFileSnapshotForWrite,
  writeConfigFile,
} from "./config/config.js";
import type { OpenClawConfig } from "./config/types.js";
import { applyWhatsAppGroupAllowlist } from "./propai/group-allowlist.js";
import {
  discoverKnownWhatsAppGroups,
  resolveWhatsAppGroupTargets,
} from "./propai/group-discovery.js";
import {
  mapPropAiArgs,
  renderFriendlyFailure,
  renderPropAiHelp,
  type PropAiCommandRoute,
} from "./propai/mapper.js";
import { initializeRealtorWorkspaceProfile } from "./propai/realtor-workspace.js";
import { maybeSeedRealtorWorkspaceBeforeSetup } from "./propai/setup-bootstrap.js";
import { applyProcessEnvValues, resolvePropaiclawRuntimeEnv } from "./propaiclaw-entry.env.js";
import {
  formatConfigInvalidHint,
  formatRuntimeDebugLine,
  formatRuntimeLaunchFailure,
  formatRuntimeSignalExit,
} from "./propaiclaw-entry.messages.js";
import { normalizeAccountId, normalizeAgentId } from "./routing/session-key.js";
import { listWhatsAppAccountIds, resolveDefaultWhatsAppAccountId } from "./web/accounts.js";

function resolveCliCommandName(argv = process.argv): string {
  const executable = argv[1];
  if (typeof executable !== "string" || !executable.trim()) {
    return "propaiclaw";
  }
  const base = path.basename(executable).replace(/\.(cmd|exe|js|mjs)$/i, "");
  if (base === "propai") {
    return "propai";
  }
  return "propaiclaw";
}

const CLI_COMMAND_NAME = resolveCliCommandName();

function bootstrapPropaiclawRuntimeIdentity(): void {
  const runtimeEnv = resolvePropaiclawRuntimeEnv(process.env);
  applyProcessEnvValues(runtimeEnv, process.env);
}

function resolveOpenClawWrapperPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "openclaw.mjs");
}

function resolveGroupScope(params: {
  config: OpenClawConfig;
  accountId?: string;
  agentId?: string;
}): { accountId: string; agentId: string } {
  const accountIds = listWhatsAppAccountIds(params.config).map((accountId) =>
    normalizeAccountId(accountId),
  );
  let accountId: string;
  if (params.accountId?.trim()) {
    const normalized = normalizeAccountId(params.accountId);
    if (!accountIds.includes(normalized)) {
      throw new Error(
        `Unknown WhatsApp account "${params.accountId}". Available accounts: ${accountIds.join(", ")}`,
      );
    }
    accountId = normalized;
  } else {
    if (accountIds.length > 1) {
      throw new Error(
        `Multiple WhatsApp accounts configured (${accountIds.join(", ")}). Use --account <id>.`,
      );
    }
    accountId = normalizeAccountId(resolveDefaultWhatsAppAccountId(params.config));
  }

  const agentIds = listAgentIds(params.config).map((agentId) => normalizeAgentId(agentId));
  let agentId: string;
  if (params.agentId?.trim()) {
    const normalized = normalizeAgentId(params.agentId);
    if (!agentIds.includes(normalized)) {
      throw new Error(
        `Unknown agent "${params.agentId}". Available agents: ${agentIds.join(", ")}`,
      );
    }
    agentId = normalized;
  } else {
    agentId = normalizeAgentId(resolveDefaultAgentId(params.config));
  }

  return { accountId, agentId };
}

function runOpenClawCommand(params: {
  openClawWrapperPath: string;
  args: string[];
  debug: boolean;
  commandLabel: string;
}): Promise<number> {
  const { openClawWrapperPath, args, debug, commandLabel } = params;
  if (debug) {
    process.stderr.write(formatRuntimeDebugLine(CLI_COMMAND_NAME, args));
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [openClawWrapperPath, ...args], {
      stdio: "inherit",
      env: resolvePropaiclawRuntimeEnv(process.env),
    });

    child.once("error", (error) => {
      process.stderr.write(
        formatRuntimeLaunchFailure(
          CLI_COMMAND_NAME,
          error instanceof Error ? error.message : String(error),
        ),
      );
      resolve(1);
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        process.stderr.write(formatRuntimeSignalExit(CLI_COMMAND_NAME, signal));
        resolve(1);
        return;
      }
      const exitCode = typeof code === "number" ? code : 1;
      if (exitCode !== 0 && !debug) {
        process.stderr.write(`${renderFriendlyFailure(commandLabel, CLI_COMMAND_NAME)}\n`);
      }
      resolve(exitCode);
    });
  });
}

async function runRoute(route: PropAiCommandRoute): Promise<number> {
  const openClawWrapperPath = resolveOpenClawWrapperPath();
  if (route.kind === "help") {
    process.stdout.write(`${renderPropAiHelp(CLI_COMMAND_NAME)}\n`);
    return 0;
  }
  if (route.kind === "error") {
    process.stderr.write(`[${CLI_COMMAND_NAME}] ${route.message}\n`);
    process.stderr.write(`Run "${CLI_COMMAND_NAME} --help" for usage.\n`);
    return 2;
  }
  if (route.kind === "single") {
    await maybeSeedRealtorWorkspaceBeforeSetup({
      commandLabel: route.commandLabel,
      args: route.args,
      debug: route.debug,
    });
    return await runOpenClawCommand({
      openClawWrapperPath,
      args: route.args,
      debug: route.debug,
      commandLabel: route.commandLabel,
    });
  }
  if (route.kind === "local") {
    if (route.commandLabel === "profile-init") {
      try {
        const result = await initializeRealtorWorkspaceProfile(route.params);
        process.stdout.write(
          `${CLI_COMMAND_NAME} workspace profile ready: ${result.workspaceDir}\n`,
        );
        if (result.writtenFiles.length > 0) {
          process.stdout.write("Updated files:\n");
          for (const filePath of result.writtenFiles) {
            process.stdout.write(`  - ${filePath}\n`);
          }
        }
        if (result.skippedFiles.length > 0) {
          process.stdout.write("Unchanged files (already present):\n");
          for (const filePath of result.skippedFiles) {
            process.stdout.write(`  - ${filePath}\n`);
          }
          process.stdout.write("Use --overwrite to replace existing files.\n");
        }
        process.stdout.write(
          [
            "Next steps:",
            `  1) ${CLI_COMMAND_NAME} sync`,
            `  2) ${CLI_COMMAND_NAME} start`,
            `  3) ${CLI_COMMAND_NAME} connect whatsapp`,
          ].join("\n") + "\n",
        );
        return 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `[${CLI_COMMAND_NAME}] Failed to initialize workspace profile: ${message}\n`,
        );
        if (!route.debug) {
          process.stderr.write(`${renderFriendlyFailure(route.commandLabel, CLI_COMMAND_NAME)}\n`);
        }
        return 1;
      }
    }
    if (route.commandLabel === "groups-list") {
      try {
        const snapshot = await readConfigFileSnapshot();
        if (!snapshot.valid) {
          process.stderr.write(formatConfigInvalidHint(CLI_COMMAND_NAME));
          for (const issue of snapshot.issues) {
            process.stderr.write(`  - ${issue.path || "<root>"}: ${issue.message}\n`);
          }
          return 1;
        }

        const scope = resolveGroupScope({
          config: snapshot.config,
          accountId: route.params.accountId,
          agentId: route.params.agentId,
        });
        const knownGroups = discoverKnownWhatsAppGroups(snapshot.config, {
          accountId: scope.accountId,
          agentIds: [scope.agentId],
        });
        const accountConfiguredGroups =
          snapshot.config.channels?.whatsapp?.accounts?.[scope.accountId]?.groups ?? {};
        const rootConfiguredGroups = snapshot.config.channels?.whatsapp?.groups ?? {};
        const accountHasExplicitGroups = Object.keys(accountConfiguredGroups).length > 0;
        const configuredGroups = accountHasExplicitGroups
          ? accountConfiguredGroups
          : rootConfiguredGroups;
        const allowAllGroups = Object.prototype.hasOwnProperty.call(configuredGroups, "*");
        const allowlistedGroupIds = Object.keys(configuredGroups)
          .map((groupId) => groupId.trim().toLowerCase())
          .filter((groupId) => groupId && groupId !== "*")
          .toSorted();

        process.stdout.write(
          `Scope: account=${scope.accountId} agent=${scope.agentId} (tenant-safe)\n\n`,
        );
        process.stdout.write("Known WhatsApp groups (from recent conversations):\n");
        if (knownGroups.length === 0) {
          process.stdout.write("  (none yet)\n");
          process.stdout.write(
            `  Tip: send one message in the target group, then re-run ${CLI_COMMAND_NAME} groups list.\n`,
          );
        } else {
          for (const group of knownGroups) {
            const label = group.subject ? `"${group.subject}"` : "(no subject yet)";
            process.stdout.write(`  - ${label} -> ${group.groupId}\n`);
          }
        }

        process.stdout.write("\nConfigured allowlist:\n");
        if (!accountHasExplicitGroups && Object.keys(rootConfiguredGroups).length > 0) {
          process.stdout.write(
            "  ! Using shared root WhatsApp groups config (inherited across accounts).\n",
          );
        }
        if (allowAllGroups) {
          process.stdout.write("  - * (allow all groups)\n");
        }
        if (allowlistedGroupIds.length === 0) {
          process.stdout.write("  (no explicit allowlisted groups)\n");
        } else {
          for (const groupId of allowlistedGroupIds) {
            process.stdout.write(`  - ${groupId}\n`);
          }
        }

        process.stdout.write(
          [
            "\nNext steps:",
            `  1) ${CLI_COMMAND_NAME} groups allow "Group Name" --account ${scope.accountId} --agent ${scope.agentId}`,
            `  2) ${CLI_COMMAND_NAME} groups allow <group-id> --account ${scope.accountId} --agent ${scope.agentId}`,
            `  3) ${CLI_COMMAND_NAME} groups allow-all --account ${scope.accountId} --agent ${scope.agentId}`,
          ].join("\n") + "\n",
        );
        return 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[${CLI_COMMAND_NAME}] Failed to list WhatsApp groups: ${message}\n`);
        if (!route.debug) {
          process.stderr.write(`${renderFriendlyFailure(route.commandLabel, CLI_COMMAND_NAME)}\n`);
        }
        return 1;
      }
    }
    if (route.commandLabel === "groups-allow") {
      try {
        const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
        if (!snapshot.valid) {
          process.stderr.write(formatConfigInvalidHint(CLI_COMMAND_NAME));
          for (const issue of snapshot.issues) {
            process.stderr.write(`  - ${issue.path || "<root>"}: ${issue.message}\n`);
          }
          return 1;
        }

        const scope = resolveGroupScope({
          config: snapshot.config,
          accountId: route.params.accountId,
          agentId: route.params.agentId,
        });
        const resolvedTargets = resolveWhatsAppGroupTargets(
          snapshot.config,
          route.params.groupIds,
          {
            accountId: scope.accountId,
            agentIds: [scope.agentId],
          },
        );
        if (resolvedTargets.errors.length > 0) {
          process.stderr.write(`[${CLI_COMMAND_NAME}] Could not resolve all requested groups.\n`);
          for (const issue of resolvedTargets.errors) {
            if (issue.reason === "not-found") {
              process.stderr.write(`  - "${issue.input}": no matching WhatsApp group found.\n`);
              continue;
            }
            process.stderr.write(`  - "${issue.input}": matched multiple groups.\n`);
            for (const match of issue.matches) {
              const label = match.subject ? `"${match.subject}"` : "(no subject)";
              process.stderr.write(`      * ${label} -> ${match.groupId}\n`);
            }
          }
          process.stderr.write(
            `Run "${CLI_COMMAND_NAME} groups list" to discover group names and IDs.\n`,
          );
          return 2;
        }

        const updated = applyWhatsAppGroupAllowlist(snapshot.config, resolvedTargets.groupIds, {
          accountId: scope.accountId,
        });
        const configChanged = !isDeepStrictEqual(updated.config, snapshot.config);
        if (!configChanged && updated.existingGroupIds.length > 0) {
          process.stdout.write(
            `[${CLI_COMMAND_NAME}] WhatsApp group allowlist already contained all requested groups for account ${scope.accountId}.\n`,
          );
          return 0;
        }

        await writeConfigFile(updated.config, writeOptions);
        process.stdout.write(
          `[${CLI_COMMAND_NAME}] Updated WhatsApp group allowlist for account ${scope.accountId} (${updated.addedGroupIds.length} added).\n`,
        );
        const resolvedByName = resolvedTargets.resolved.filter(
          (entry) => entry.matchedBy === "name-exact" || entry.matchedBy === "name-contains",
        );
        if (resolvedByName.length > 0) {
          process.stdout.write("Resolved names:\n");
          for (const resolved of resolvedByName) {
            const label = resolved.subject ? `"${resolved.subject}"` : "(no subject)";
            process.stdout.write(`  - "${resolved.input}" -> ${label} -> ${resolved.groupId}\n`);
          }
        }
        if (updated.addedGroupIds.length > 0) {
          process.stdout.write("Added groups:\n");
          for (const groupId of updated.addedGroupIds) {
            process.stdout.write(`  - ${groupId}\n`);
          }
        }
        if (updated.existingGroupIds.length > 0) {
          process.stdout.write("Already present:\n");
          for (const groupId of updated.existingGroupIds) {
            process.stdout.write(`  - ${groupId}\n`);
          }
        }
        process.stdout.write(
          [
            "Next steps:",
            `  1) ${CLI_COMMAND_NAME} groups list --account ${scope.accountId} --agent ${scope.agentId}`,
            `  2) ${CLI_COMMAND_NAME} status`,
          ].join("\n") + "\n",
        );
        return 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `[${CLI_COMMAND_NAME}] Failed to update group allowlist: ${message}\n`,
        );
        if (!route.debug) {
          process.stderr.write(`${renderFriendlyFailure(route.commandLabel, CLI_COMMAND_NAME)}\n`);
        }
        return 1;
      }
    }
  }

  for (const command of route.commands) {
    const code = await runOpenClawCommand({
      openClawWrapperPath,
      args: command.args,
      debug: route.debug,
      commandLabel: command.commandLabel,
    });
    if (code !== 0) {
      return code;
    }
  }
  return 0;
}

bootstrapPropaiclawRuntimeIdentity();
const route = mapPropAiArgs(process.argv.slice(2), new Date(), CLI_COMMAND_NAME);
const code = await runRoute(route);
process.exitCode = code;
