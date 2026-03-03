import { describe, expect, it } from "vitest";
import { applyProcessEnvValues, resolvePropaiclawRuntimeEnv } from "./propaiclaw-entry.env.js";

describe("propaiclaw runtime env bootstrap", () => {
  it("enables propaiclaw mode and whatsapp channel default", () => {
    const resolved = resolvePropaiclawRuntimeEnv({} as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_MODE).toBe("1");
    expect(resolved.PROPAICLAW_CHANNELS_ONLY).toBe("whatsapp");
  });

  it("keeps canonical propaiclaw env values", () => {
    const resolved = resolvePropaiclawRuntimeEnv({
      PROPAICLAW_STATE_DIR: "/canonical/state",
      PROPAICLAW_CONFIG_PATH: "/canonical/propaiclaw.json",
      PROPAICLAW_HOME: "/canonical/home",
      PROPAICLAW_PROFILE: "tenant-a",
      PROPAICLAW_OAUTH_DIR: "/canonical/oauth",
    } as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_STATE_DIR).toBe("/canonical/state");
    expect(resolved.PROPAICLAW_CONFIG_PATH).toBe("/canonical/propaiclaw.json");
    expect(resolved.PROPAICLAW_HOME).toBe("/canonical/home");
    expect(resolved.PROPAICLAW_PROFILE).toBe("tenant-a");
    expect(resolved.PROPAICLAW_OAUTH_DIR).toBe("/canonical/oauth");
  });

  it("does not backfill canonical aliases from unrelated runtime env values", () => {
    const resolved = resolvePropaiclawRuntimeEnv({
      LEGACY_HOME: "/legacy/home",
      LEGACY_OAUTH_DIR: "/legacy/oauth",
      LEGACY_PROFILE: "tenant-a",
    } as NodeJS.ProcessEnv);
    expect(resolved.PROPAICLAW_HOME).toBeUndefined();
    expect(resolved.PROPAICLAW_OAUTH_DIR).toBeUndefined();
    expect(resolved.PROPAICLAW_PROFILE).toBeUndefined();
    expect(resolved.LEGACY_HOME).toBe("/legacy/home");
    expect(resolved.LEGACY_OAUTH_DIR).toBe("/legacy/oauth");
    expect(resolved.LEGACY_PROFILE).toBe("tenant-a");
  });

  it("applies resolved env values onto process-like env target", () => {
    const target = {} as NodeJS.ProcessEnv;
    const source = resolvePropaiclawRuntimeEnv({
      PROPAICLAW_GATEWAY_PORT: "18790",
    } as NodeJS.ProcessEnv);
    applyProcessEnvValues(source, target);
    expect(target.PROPAICLAW_GATEWAY_PORT).toBe("18790");
    expect(target.PROPAICLAW_MODE).toBe("1");
  });
});
