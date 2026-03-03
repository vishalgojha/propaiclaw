import { describe, expect, it } from "vitest";
import {
  applyProcessEnvValues,
  resolveLegacyOpenClawEnvDeprecationWarnings,
  resolvePropaiclawRuntimeEnv,
} from "./propaiclaw-entry.env.js";

describe("propaiclaw runtime env bootstrap", () => {
  it("enables propaiclaw mode and whatsapp channel default", () => {
    const resolved = resolvePropaiclawRuntimeEnv({} as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_MODE).toBe("1");
    expect(resolved.OPENCLAW_PROPAICLAW_MODE).toBe("1");
    expect(resolved.PROPAICLAW_CHANNELS_ONLY).toBe("whatsapp");
    expect(resolved.OPENCLAW_CHANNELS_ONLY).toBe("whatsapp");
  });

  it("prefers canonical propaiclaw env values over legacy values", () => {
    const resolved = resolvePropaiclawRuntimeEnv({
      PROPAICLAW_STATE_DIR: "/canonical/state",
      OPENCLAW_STATE_DIR: "/legacy/state",
      PROPAICLAW_CONFIG_PATH: "/canonical/propaiclaw.json",
      OPENCLAW_CONFIG_PATH: "/legacy/openclaw.json",
    } as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_STATE_DIR).toBe("/canonical/state");
    expect(resolved.OPENCLAW_STATE_DIR).toBe("/canonical/state");
    expect(resolved.PROPAICLAW_CONFIG_PATH).toBe("/canonical/propaiclaw.json");
    expect(resolved.OPENCLAW_CONFIG_PATH).toBe("/canonical/propaiclaw.json");
  });

  it("mirrors legacy values into canonical aliases when canonical is unset", () => {
    const resolved = resolvePropaiclawRuntimeEnv({
      OPENCLAW_HOME: "/legacy/home",
      OPENCLAW_OAUTH_DIR: "/legacy/oauth",
      OPENCLAW_PROFILE: "tenant-a",
    } as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_HOME).toBe("/legacy/home");
    expect(resolved.OPENCLAW_HOME).toBe("/legacy/home");
    expect(resolved.PROPAICLAW_OAUTH_DIR).toBe("/legacy/oauth");
    expect(resolved.OPENCLAW_OAUTH_DIR).toBe("/legacy/oauth");
    expect(resolved.PROPAICLAW_PROFILE).toBe("tenant-a");
    expect(resolved.OPENCLAW_PROFILE).toBe("tenant-a");
  });

  it("applies resolved env values onto process-like env target", () => {
    const target = {} as NodeJS.ProcessEnv;
    const source = resolvePropaiclawRuntimeEnv({
      PROPAICLAW_GATEWAY_PORT: "18790",
    } as NodeJS.ProcessEnv);
    applyProcessEnvValues(source, target);
    expect(target.PROPAICLAW_GATEWAY_PORT).toBe("18790");
    expect(target.OPENCLAW_GATEWAY_PORT).toBe("18790");
    expect(target.PROPAICLAW_MODE).toBe("1");
  });

  it("warns when legacy OPENCLAW envs are used without canonical aliases", () => {
    const warnings = resolveLegacyOpenClawEnvDeprecationWarnings({
      env: {
        OPENCLAW_STATE_DIR: "/legacy/state",
        OPENCLAW_PROFILE: "legacy-profile",
      } as NodeJS.ProcessEnv,
      commandName: "propai",
    });
    expect(warnings).toEqual([
      "[propai] OPENCLAW_STATE_DIR is a legacy compatibility env. Prefer PROPAICLAW_STATE_DIR for Propaiclaw runtime identity.",
      "[propai] OPENCLAW_PROFILE is a legacy compatibility env. Prefer PROPAICLAW_PROFILE for Propaiclaw runtime identity.",
    ]);
  });

  it("suppresses warning when canonical env alias is already set", () => {
    const warnings = resolveLegacyOpenClawEnvDeprecationWarnings({
      env: {
        OPENCLAW_STATE_DIR: "/legacy/state",
        PROPAICLAW_STATE_DIR: "/canonical/state",
      } as NodeJS.ProcessEnv,
      commandName: "propaiclaw",
    });
    expect(warnings).toEqual([]);
  });
});
