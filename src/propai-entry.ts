#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  mapPropAiArgs,
  renderFriendlyFailure,
  renderPropAiHelp,
  type PropAiCommandRoute,
} from "./propai/mapper.js";
import { initializeRealtorWorkspaceProfile } from "./propai/realtor-workspace.js";
import { maybeSeedRealtorWorkspaceBeforeSetup } from "./propai/setup-bootstrap.js";

function resolveOpenClawWrapperPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "openclaw.mjs");
}

function runOpenClawCommand(params: {
  openClawWrapperPath: string;
  args: string[];
  debug: boolean;
  commandLabel: string;
}): Promise<number> {
  const { openClawWrapperPath, args, debug, commandLabel } = params;
  if (debug) {
    process.stderr.write(`[propai debug] openclaw ${args.join(" ")}\n`);
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [openClawWrapperPath, ...args], {
      stdio: "inherit",
      env: process.env,
    });

    child.once("error", (error) => {
      process.stderr.write(
        `[propai] Failed to launch OpenClaw: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      resolve(1);
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        process.stderr.write(`[propai] OpenClaw exited due to signal ${signal}\n`);
        resolve(1);
        return;
      }
      const exitCode = typeof code === "number" ? code : 1;
      if (exitCode !== 0 && !debug) {
        process.stderr.write(`${renderFriendlyFailure(commandLabel)}\n`);
      }
      resolve(exitCode);
    });
  });
}

async function runRoute(route: PropAiCommandRoute): Promise<number> {
  const openClawWrapperPath = resolveOpenClawWrapperPath();
  if (route.kind === "help") {
    process.stdout.write(`${renderPropAiHelp()}\n`);
    return 0;
  }
  if (route.kind === "error") {
    process.stderr.write(`[propai] ${route.message}\n`);
    process.stderr.write('Run "propai --help" for usage.\n');
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
        process.stdout.write(`PropAI workspace profile ready: ${result.workspaceDir}\n`);
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
            "  1) propai sync",
            "  2) propai start",
            "  3) propai connect whatsapp",
          ].join("\n") + "\n",
        );
        return 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[propai] Failed to initialize workspace profile: ${message}\n`);
        if (!route.debug) {
          process.stderr.write(`${renderFriendlyFailure(route.commandLabel)}\n`);
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

const route = mapPropAiArgs(process.argv.slice(2));
const code = await runRoute(route);
process.exitCode = code;
