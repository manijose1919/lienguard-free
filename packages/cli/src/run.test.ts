import { describe, it, expect } from "vitest";
import { runCli } from "./run.js";

describe("runCli — help & argument errors", () => {
  it("prints help with no arguments (exit 0)", () => {
    const r = runCli([]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Usage:/);
  });

  it("prints help on --help", () => {
    expect(runCli(["--help"]).stdout).toMatch(/Usage:/);
  });

  it("errors on an unknown positional argument (exit 2)", () => {
    const r = runCli(["oops"]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toMatch(/Unexpected argument/);
  });

  it("errors when a flag is missing its value", () => {
    const r = runCli(["--state", "--role", "laborer", "--first", "2025-03-03"]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toMatch(/requires a value/);
  });

  it("lists all missing required flags at once", () => {
    const r = runCli(["--json"]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain("--state");
    expect(r.stderr).toContain("--role");
    expect(r.stderr).toContain("--first");
  });

  it("rejects an invalid role before touching the engine", () => {
    const r = runCli(["--state", "CA", "--role", "architect", "--first", "2025-03-03"]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toMatch(/Invalid --role/);
  });
});

describe("runCli — successful calculation", () => {
  it("renders a text schedule for a valid CA subcontractor", () => {
    const r = runCli(["--state", "ca", "--role", "subcontractor", "--first", "2025-03-03"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Deadline Schedule/);
    expect(r.stdout).toMatch(/2025-03-24/); // rolled prelim deadline
    expect(r.stdout).toMatch(/CRITICAL/);
    expect(r.stdout).toMatch(/not legal advice/i);
  });

  it("emits valid JSON with --json", () => {
    const r = runCli([
      "--state",
      "CA",
      "--role",
      "subcontractor",
      "--first",
      "2025-03-03",
      "--json",
    ]);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.state).toBe("CA");
    expect(parsed.meta.engineVersion).toBeTruthy();
  });

  it("returns exit 1 with a hint for an unsupported state", () => {
    const r = runCli(["--state", "ZZ", "--role", "laborer", "--first", "2025-03-03"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/Supported states/);
  });

  it("returns exit 1 for a malformed date", () => {
    const r = runCli(["--state", "CA", "--role", "laborer", "--first", "2025-02-30"]);
    expect(r.exitCode).toBe(1);
  });
});
