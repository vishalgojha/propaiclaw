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
    };

export function renderPropAiHelp(): string {
  return [
    "PropAi Sync CLI (Indian realtor wrapper for OpenClaw)",
    "",
    "Usage:",
    "  propai start",
    "  propai setup",
    "  propai connect <app>",
    '  propai lead follow-up <target> "<message>"',
    '  propai schedule daily "<message>" --to <target>',
    "  propai history [target]",
    "  propai status",
    "  propai raw <openclaw args...>",
    "",
    "Examples:",
    "  propai start",
    "  propai connect whatsapp",
    '  propai lead follow-up +15555550123 "Just checking in on 123 Main St!"',
    '  propai schedule daily "Good morning check-in" --to +15555550123',
    "  propai history +15555550123 --limit 30",
    "  propai status",
    "",
    "Flags:",
    "  --debug   Show underlying OpenClaw command and keep raw diagnostics",
  ].join("\n");
}

type ParsedArgs = {
  debug: boolean;
  tokens: string[];
};

function parseGlobalFlags(argv: string[]): ParsedArgs {
  const tokens: string[] = [];
  let debug = false;

  for (const token of argv) {
    if (token === "--debug") {
      debug = true;
      continue;
    }
    tokens.push(token);
  }
  return { debug, tokens };
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
  const { debug, tokens } = parseGlobalFlags(argv);
  const [primary, secondary, ...rest] = tokens;

  if (!primary || isHelpToken(primary)) {
    return { kind: "help", debug };
  }

  if (primary === "start") {
    return { kind: "single", debug, commandLabel: "start", args: ["gateway", "run", ...rest] };
  }

  if (primary === "setup") {
    return { kind: "single", debug, commandLabel: "setup", args: ["onboard", ...rest] };
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
    case "connect":
      return "PropAi Sync could not connect that app. Confirm your AI engine is running with `propai status`, then retry.";
    case "lead-follow-up":
      return "PropAi Sync could not send the follow-up. Confirm your connection with `propai status`, then retry.";
    case "schedule-daily":
      return "PropAi Sync could not create the daily follow-up schedule. Run with `--debug` to inspect the underlying cron command.";
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
