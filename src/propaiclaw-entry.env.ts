function readTrimmed(
  env: NodeJS.ProcessEnv,
  ...keys: Array<keyof NodeJS.ProcessEnv>
): string | undefined {
  for (const key of keys) {
    const raw = env[key];
    if (typeof raw !== "string") {
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

export function resolvePropaiclawRuntimeEnv(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const stateDir = readTrimmed(env, "PROPAICLAW_STATE_DIR", "OPENCLAW_STATE_DIR");
  const configPath = readTrimmed(env, "PROPAICLAW_CONFIG_PATH", "OPENCLAW_CONFIG_PATH");
  const homeDir = readTrimmed(env, "PROPAICLAW_HOME", "OPENCLAW_HOME");
  const profile = readTrimmed(env, "PROPAICLAW_PROFILE", "OPENCLAW_PROFILE");
  const gatewayPort = readTrimmed(env, "PROPAICLAW_GATEWAY_PORT", "OPENCLAW_GATEWAY_PORT");
  const channelsOnly =
    readTrimmed(env, "PROPAICLAW_CHANNELS_ONLY", "OPENCLAW_CHANNELS_ONLY") ?? "whatsapp";
  const oauthDir = readTrimmed(env, "PROPAICLAW_OAUTH_DIR", "OPENCLAW_OAUTH_DIR");

  return {
    ...env,
    PROPAICLAW_MODE: "1",
    OPENCLAW_PROPAICLAW_MODE: "1",
    PROPAICLAW_CHANNELS_ONLY: channelsOnly,
    OPENCLAW_CHANNELS_ONLY: channelsOnly,
    ...(stateDir ? { PROPAICLAW_STATE_DIR: stateDir, OPENCLAW_STATE_DIR: stateDir } : {}),
    ...(configPath ? { PROPAICLAW_CONFIG_PATH: configPath, OPENCLAW_CONFIG_PATH: configPath } : {}),
    ...(homeDir ? { PROPAICLAW_HOME: homeDir, OPENCLAW_HOME: homeDir } : {}),
    ...(profile ? { PROPAICLAW_PROFILE: profile, OPENCLAW_PROFILE: profile } : {}),
    ...(gatewayPort
      ? { PROPAICLAW_GATEWAY_PORT: gatewayPort, OPENCLAW_GATEWAY_PORT: gatewayPort }
      : {}),
    ...(oauthDir ? { PROPAICLAW_OAUTH_DIR: oauthDir, OPENCLAW_OAUTH_DIR: oauthDir } : {}),
  };
}

export function applyProcessEnvValues(
  source: NodeJS.ProcessEnv,
  target: NodeJS.ProcessEnv = process.env,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") {
      target[key] = value;
    }
  }
}

export function resolveLegacyOpenClawEnvDeprecationWarnings(params: {
  env?: NodeJS.ProcessEnv;
  commandName?: string;
}): string[] {
  const env = params.env ?? process.env;
  const commandName = params.commandName ?? "propaiclaw";
  const aliases: Array<{ legacy: keyof NodeJS.ProcessEnv; canonical: keyof NodeJS.ProcessEnv }> = [
    { legacy: "OPENCLAW_HOME", canonical: "PROPAICLAW_HOME" },
    { legacy: "OPENCLAW_STATE_DIR", canonical: "PROPAICLAW_STATE_DIR" },
    { legacy: "OPENCLAW_CONFIG_PATH", canonical: "PROPAICLAW_CONFIG_PATH" },
    { legacy: "OPENCLAW_PROFILE", canonical: "PROPAICLAW_PROFILE" },
    { legacy: "OPENCLAW_GATEWAY_PORT", canonical: "PROPAICLAW_GATEWAY_PORT" },
    { legacy: "OPENCLAW_CHANNELS_ONLY", canonical: "PROPAICLAW_CHANNELS_ONLY" },
    { legacy: "OPENCLAW_OAUTH_DIR", canonical: "PROPAICLAW_OAUTH_DIR" },
  ];

  const warnings: string[] = [];
  for (const alias of aliases) {
    const legacyValue = readTrimmed(env, alias.legacy);
    if (!legacyValue) {
      continue;
    }
    const canonicalValue = readTrimmed(env, alias.canonical);
    if (canonicalValue) {
      continue;
    }
    warnings.push(
      `[${commandName}] ${alias.legacy} is a legacy compatibility env. Prefer ${alias.canonical} for Propaiclaw runtime identity.`,
    );
  }
  return warnings;
}
