export type PropAiCommandRoute =
  | {
      kind: "help";
      debug: boolean;
    }
  | {
      kind: "error";
      debug: boolean;
      message: string;
    }
  | {
      kind: "single";
      debug: boolean;
      commandLabel: string;
      args: string[];
    }
  | {
      kind: "multi";
      debug: boolean;
      commands: Array<{ commandLabel: string; args: string[] }>;
    }
  | {
      kind: "local";
      debug: boolean;
      commandLabel: "profile-init";
      params: {
        brokerageName?: string;
        ownerName?: string;
        agentName?: string;
        timezone?: string;
        city?: string;
        focus?: string;
        workspaceDir?: string;
        overwrite: boolean;
      };
    };

export function renderPropAiHelp(): string {
  return [
    "PropAI Realtor CLI (realtor-first wrapper for OpenClaw)",
    "",
    "Usage:",
    "  propai profile init [brokerage-name] [options]",
    "  propai start",
    "  propai setup",
    "  propai sync",
    "  propai connect <app>",
    '  propai lead follow-up <target> "<message>"',
    '  propai schedule daily "<message>" --to <target>',
    "  propai history [target]",
    "  propai status",
    "",
    "Examples:",
    '  propai profile init "Acme Realty" --owner "Vishal" --city "Miami"',
    "  propai start",
    "  propai sync",
    "  propai connect whatsapp",
    '  propai lead follow-up +15555550123 "Just checking in on 123 Main St!"',
    '  propai schedule daily "Good morning check-in" --to +15555550123',
    "  propai history +15555550123 --limit 30",
    "  propai status",
    "",
    "Flags:",
    "  --debug   Show underlying OpenClaw command and keep raw diagnostics",
    "  --admin   Enable advanced/developer passthrough commands",
    "",
    "Advanced (admin only):",
    "  propai --admin raw <openclaw args...>",
  ].join("\n");
}

type ParsedArgs = {
  debug: boolean;
  admin: boolean;
  tokens: string[];
};

function parseGlobalFlags(argv: string[]): ParsedArgs {
  const tokens: string[] = [];
  let debug = false;
  let admin = false;

  for (const token of argv) {
    if (token === "--debug") {
      debug = true;
      continue;
    }
    if (token === "--admin") {
      admin = true;
      continue;
    }
    tokens.push(token);
  }
  return { debug, admin, tokens };
}

function isHelpToken(token: string | undefined): boolean {
  return token === "-h" || token === "--help" || token === "help";
}

function hasOptionFlag(tokens: string[], name: string): boolean {
  if (tokens.includes(name)) {
    return true;
  }
  return tokens.some((token) => token.startsWith(`${name}=`));
}

type ParsedLongOptions = {
  options: Map<string, string | true>;
  positionals: string[];
  invalidOption: string | null;
};

function parseLongOptions(tokens: string[]): ParsedLongOptions {
  const options = new Map<string, string | true>();
  const positionals: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (!token.startsWith("-")) {
      positionals.push(token);
      continue;
    }
    if (!token.startsWith("--")) {
      return { options, positionals, invalidOption: token };
    }
    const eqIndex = token.indexOf("=");
    if (eqIndex > 0) {
      const key = token.slice(2, eqIndex).trim();
      const value = token.slice(eqIndex + 1);
      options.set(key, value);
      continue;
    }

    const key = token.slice(2).trim();
    const nextToken = tokens[index + 1];
    if (nextToken && !nextToken.startsWith("-")) {
      options.set(key, nextToken);
      index += 1;
      continue;
    }
    options.set(key, true);
  }

  return { options, positionals, invalidOption: null };
}

function readStringOption(options: Map<string, string | true>, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = options.get(name);
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
    }
  }
  return undefined;
}

function buildDailyJobName(now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `propai-daily-${stamp}`;
}

function mapStatus(debug: boolean, options: string[]): PropAiCommandRoute {
  return {
    kind: "multi",
    debug,
    commands: [
      { commandLabel: "status", args: ["status", ...options] },
      { commandLabel: "health", args: ["health", ...options] },
    ],
  };
}

export function mapPropAiArgs(argv: string[], now: Date = new Date()): PropAiCommandRoute {
  const { debug, admin, tokens } = parseGlobalFlags(argv);
  const [primary, secondary, ...rest] = tokens;

  if (!primary || isHelpToken(primary)) {
    return { kind: "help", debug };
  }

  if (primary === "start") {
    const startArgs = [secondary, ...rest].filter((part): part is string => Boolean(part));
    return { kind: "single", debug, commandLabel: "start", args: ["gateway", "run", ...startArgs] };
  }

  if (primary === "setup" || primary === "sync") {
    const setupArgs = [secondary, ...rest].filter((part): part is string => Boolean(part));
    const args = ["onboard"];
    if (!hasOptionFlag(setupArgs, "--flow")) {
      args.push("--flow", "quickstart");
    }
    if (!hasOptionFlag(setupArgs, "--skip-ui")) {
      args.push("--skip-ui");
    }
    args.push(...setupArgs);
    return { kind: "single", debug, commandLabel: primary, args };
  }

  if (primary === "profile") {
    if (secondary !== "init") {
      return {
        kind: "error",
        debug,
        message: "Unsupported profile command. Use: propai profile init [brokerage-name] [options]",
      };
    }

    const parsed = parseLongOptions(rest);
    if (parsed.invalidOption) {
      return {
        kind: "error",
        debug,
        message: `Unsupported option format: ${parsed.invalidOption}. Use long options like --owner "Name".`,
      };
    }

    if (parsed.positionals.length > 1) {
      return {
        kind: "error",
        debug,
        message:
          "Too many positional values. Usage: propai profile init [brokerage-name] [--owner ... --agent-name ...]",
      };
    }

    const brokerageName =
      readStringOption(parsed.options, "brokerage", "team") ?? parsed.positionals[0]?.trim();
    const ownerName = readStringOption(parsed.options, "owner");
    const agentName = readStringOption(parsed.options, "agent-name", "agent");
    const timezone = readStringOption(parsed.options, "timezone", "tz");
    const city = readStringOption(parsed.options, "city");
    const focus = readStringOption(parsed.options, "focus");
    const workspaceDir = readStringOption(parsed.options, "workspace");
    const overwrite = parsed.options.get("overwrite") === true;

    return {
      kind: "local",
      debug,
      commandLabel: "profile-init",
      params: {
        brokerageName,
        ownerName,
        agentName,
        timezone,
        city,
        focus,
        workspaceDir,
        overwrite,
      },
    };
  }

  if (primary === "status") {
    return mapStatus(debug, [secondary, ...rest].filter((part): part is string => Boolean(part)));
  }

  if (primary === "connect") {
    const app = secondary?.trim();
    if (!app) {
      return {
        kind: "error",
        debug,
        message: "Missing app name. Usage: propai connect <app>",
      };
    }
    return {
      kind: "single",
      debug,
      commandLabel: "connect",
      args: ["channels", "login", "--channel", app, ...rest],
    };
  }

  if (primary === "lead") {
    if (secondary !== "follow-up") {
      return {
        kind: "error",
        debug,
        message:
          "Unsupported lead command. Use: propai lead follow-up <target> \"<message>\"",
      };
    }
    const target = rest[0]?.trim();
    const message = rest[1];
    const passthrough = rest.slice(2);
    if (!target || !message) {
      return {
        kind: "error",
        debug,
        message:
          "Missing follow-up target or message. Usage: propai lead follow-up <target> \"<message>\"",
      };
    }
    return {
      kind: "single",
      debug,
      commandLabel: "lead-follow-up",
      args: ["message", "send", "--target", target, "--message", message, ...passthrough],
    };
  }

  if (primary === "history") {
    const maybeTarget = secondary;
    if (maybeTarget && !maybeTarget.startsWith("-")) {
      return {
        kind: "single",
        debug,
        commandLabel: "history-target",
        args: ["message", "read", "--target", maybeTarget, ...rest],
      };
    }
    return {
      kind: "single",
      debug,
      commandLabel: "history",
      args: ["sessions", secondary, ...rest].filter((part): part is string => Boolean(part)),
    };
  }

  if (primary === "schedule") {
    if (secondary !== "daily") {
      return {
        kind: "error",
        debug,
        message: "Unsupported schedule command. Use: propai schedule daily \"<message>\" --to <target>",
      };
    }
    const message = rest[0];
    const options = rest.slice(1);
    if (!message) {
      return {
        kind: "error",
        debug,
        message: "Missing daily message. Usage: propai schedule daily \"<message>\" --to <target>",
      };
    }
    if (!hasOptionFlag(options, "--to")) {
      return {
        kind: "error",
        debug,
        message: "Missing destination. Usage: propai schedule daily \"<message>\" --to <target>",
      };
    }
    const args = [
      "cron",
      "add",
      "--every",
      "1d",
      "--message",
      message,
      "--session",
      "isolated",
      "--announce",
    ];
    if (!hasOptionFlag(options, "--name")) {
      args.push("--name", buildDailyJobName(now));
    }
    args.push(...options);
    return {
      kind: "single",
      debug,
      commandLabel: "schedule-daily",
      args,
    };
  }

  if (primary === "raw") {
    if (!admin) {
      return {
        kind: "error",
        debug,
        message: 'Advanced passthrough is disabled. Use: propai --admin raw <openclaw args...>',
      };
    }
    if (!secondary) {
      return {
        kind: "error",
        debug,
        message: "Missing OpenClaw arguments. Usage: propai raw <openclaw args...>",
      };
    }
    return {
      kind: "single",
      debug,
      commandLabel: "raw",
      args: [secondary, ...rest],
    };
  }

  return {
    kind: "error",
    debug,
    message: `Unknown command: ${primary}. Run "propai --help".`,
  };
}

export function renderFriendlyFailure(commandLabel: string): string {
  switch (commandLabel) {
    case "start":
      return "PropAi Sync could not start your AI engine. Try `propai start --debug` for full diagnostics.";
    case "setup":
    case "sync":
      return "PropAi Sync setup could not complete. Re-run with `propai sync --debug` for raw diagnostics.";
    case "connect":
      return "PropAi Sync could not connect that app. Confirm your AI engine is running with `propai status`, then retry.";
    case "lead-follow-up":
      return "PropAi Sync could not send the follow-up. Confirm your connection with `propai status`, then retry.";
    case "schedule-daily":
      return "PropAi Sync could not create the daily follow-up schedule. Run with `--debug` to inspect the underlying cron command.";
    case "profile-init":
      return "PropAi could not initialize the realtor workspace profile. Re-run with `--debug` for diagnostics.";
    case "history":
    case "history-target":
      return "PropAi Sync could not load conversation history. Ensure your AI engine is running, then retry.";
    case "status":
    case "health":
      return "PropAi Sync could not fetch status. Start the service first with `propai start`.";
    default:
      return "PropAi Sync command failed. Re-run with `--debug` for raw OpenClaw output.";
  }
}
