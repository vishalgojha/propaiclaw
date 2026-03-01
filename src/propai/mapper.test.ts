import { describe, expect, it } from "vitest";
import { mapPropAiArgs, renderFriendlyFailure, renderPropAiHelp } from "./mapper.js";

describe("mapPropAiArgs", () => {
  it("returns help for empty args", () => {
    const route = mapPropAiArgs([]);
    expect(route).toEqual({ kind: "help", debug: false });
  });

  it("maps start to gateway run", () => {
    const route = mapPropAiArgs(["start", "--port", "18789"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "start",
      args: ["gateway", "run", "--port", "18789"],
    });
  });

  it("maps setup to onboard", () => {
    const route = mapPropAiArgs(["setup"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "setup",
      args: ["onboard"],
    });
  });

  it("maps sync to onboard", () => {
    const route = mapPropAiArgs(["sync"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "sync",
      args: ["onboard"],
    });
  });

  it("maps connect command", () => {
    const route = mapPropAiArgs(["connect", "whatsapp", "--account", "primary"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "connect",
      args: ["channels", "login", "--channel", "whatsapp", "--account", "primary"],
    });
  });

  it("errors when connect app is missing", () => {
    const route = mapPropAiArgs(["connect"]);
    expect(route.kind).toBe("error");
  });

  it("maps lead follow-up to message send", () => {
    const route = mapPropAiArgs(["lead", "follow-up", "+15555550123", "Checking in"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "lead-follow-up",
      args: ["message", "send", "--target", "+15555550123", "--message", "Checking in"],
    });
  });

  it("errors for invalid lead command", () => {
    const route = mapPropAiArgs(["lead", "list"]);
    expect(route.kind).toBe("error");
  });

  it("maps history with target to message read", () => {
    const route = mapPropAiArgs(["history", "+15555550123", "--limit", "25"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "history-target",
      args: ["message", "read", "--target", "+15555550123", "--limit", "25"],
    });
  });

  it("maps history without target to sessions", () => {
    const route = mapPropAiArgs(["history"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "history",
      args: ["sessions"],
    });
  });

  it("maps status to status+health chain", () => {
    const route = mapPropAiArgs(["status"]);
    expect(route).toEqual({
      kind: "multi",
      debug: false,
      commands: [
        { commandLabel: "status", args: ["status"] },
        { commandLabel: "health", args: ["health"] },
      ],
    });
  });

  it("passes status flags through to both status and health", () => {
    const route = mapPropAiArgs(["status", "--json"]);
    expect(route).toEqual({
      kind: "multi",
      debug: false,
      commands: [
        { commandLabel: "status", args: ["status", "--json"] },
        { commandLabel: "health", args: ["health", "--json"] },
      ],
    });
  });

  it("maps schedule daily and injects defaults", () => {
    const route = mapPropAiArgs(
      ["schedule", "daily", "Morning follow-up", "--to", "+15555550123", "--channel", "whatsapp"],
      new Date("2026-03-01T08:00:00.000Z"),
    );
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "schedule-daily",
      args: [
        "cron",
        "add",
        "--every",
        "1d",
        "--message",
        "Morning follow-up",
        "--session",
        "isolated",
        "--announce",
        "--name",
        "propai-daily-20260301T080000Z",
        "--to",
        "+15555550123",
        "--channel",
        "whatsapp",
      ],
    });
  });

  it("requires --to for schedule daily", () => {
    const route = mapPropAiArgs(["schedule", "daily", "Morning follow-up"]);
    expect(route.kind).toBe("error");
  });

  it("preserves explicit schedule name", () => {
    const route = mapPropAiArgs(
      ["schedule", "daily", "Morning follow-up", "--name", "custom-job", "--to", "+15555550123"],
      new Date("2026-03-01T08:00:00.000Z"),
    );
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "schedule-daily",
      args: [
        "cron",
        "add",
        "--every",
        "1d",
        "--message",
        "Morning follow-up",
        "--session",
        "isolated",
        "--announce",
        "--name",
        "custom-job",
        "--to",
        "+15555550123",
      ],
    });
  });

  it("maps raw passthrough command", () => {
    const route = mapPropAiArgs(["raw", "skills", "list", "--eligible"]);
    expect(route).toEqual({
      kind: "single",
      debug: false,
      commandLabel: "raw",
      args: ["skills", "list", "--eligible"],
    });
  });

  it("tracks debug flag globally", () => {
    const route = mapPropAiArgs(["--debug", "start"]);
    expect(route).toEqual({
      kind: "single",
      debug: true,
      commandLabel: "start",
      args: ["gateway", "run"],
    });
  });
});

describe("propai help and failures", () => {
  it("renders help text with core commands", () => {
    const help = renderPropAiHelp();
    expect(help).toContain("propai start");
    expect(help).toContain("propai sync");
    expect(help).toContain("propai lead follow-up");
    expect(help).toContain("propai schedule daily");
  });

  it("renders friendly failure text", () => {
    expect(renderFriendlyFailure("connect")).toContain("could not connect");
    expect(renderFriendlyFailure("unknown")).toContain("command failed");
  });
});
