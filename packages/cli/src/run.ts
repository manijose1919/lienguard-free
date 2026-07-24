/**
 * CLI orchestration, decoupled from process I/O for testability.
 *
 * `runCli(argv)` takes raw argument tokens (everything after `node script`) and
 * returns a result object — it never touches `process` or `console`. The thin
 * `bin.ts` wrapper is the only place that binds to real streams and exit codes.
 */
import {
  calculateSchedule,
  CalculationError,
  isClaimantRole,
  supportedStates,
  type DeadlineInput,
} from "@lienguard/core";
import { formatScheduleText } from "./format.js";

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const HELP = `LienGuard — construction lien & preliminary-notice deadline calculator

Usage:
  lienguard --state <XX> --role <role> --first <YYYY-MM-DD> [options]

Required:
  --state <XX>            USPS state code (e.g. CA, TX, FL)
  --role <role>           general-contractor | subcontractor | sub-subcontractor
                          | material-supplier | laborer
  --first <YYYY-MM-DD>    First furnishing date

Optional dates (unlock additional deadlines):
  --last <YYYY-MM-DD>          Last furnishing date
  --completion <YYYY-MM-DD>    Project completion date
  --noc <YYYY-MM-DD>           Notice of Completion recording date

Output:
  --json                  Emit the full schedule as JSON
  --help                  Show this help

Example:
  lienguard --state CA --role subcontractor --first 2025-03-03 --completion 2025-06-01
`;

/** Parse `--flag value` tokens into a plain record. Booleans have no value. */
function parseArgs(argv: string[]): { flags: Record<string, string>; bools: Set<string> } {
  const flags: Record<string, string> = {};
  const bools = new Set<string>();
  const BOOL_FLAGS = new Set(["json", "help"]);

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument "${token}". Use --help for usage.`);
    }
    const name = token.slice(2);
    if (BOOL_FLAGS.has(name)) {
      bools.add(name);
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Flag "--${name}" requires a value.`);
    }
    flags[name] = value;
    i++; // consume the value
  }
  return { flags, bools };
}

export function runCli(argv: string[]): CliResult {
  let parsed: { flags: Record<string, string>; bools: Set<string> };
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    return { stdout: "", stderr: (err as Error).message, exitCode: 2 };
  }

  const { flags, bools } = parsed;

  if (bools.has("help") || argv.length === 0) {
    return { stdout: HELP, stderr: "", exitCode: 0 };
  }

  // Presence/shape checks with actionable messages.
  const missing: string[] = [];
  if (!flags["state"]) missing.push("--state");
  if (!flags["role"]) missing.push("--role");
  if (!flags["first"]) missing.push("--first");
  if (missing.length > 0) {
    return {
      stdout: "",
      stderr: `Missing required flag(s): ${missing.join(", ")}. Use --help for usage.`,
      exitCode: 2,
    };
  }

  const role = flags["role"]!;
  if (!isClaimantRole(role)) {
    return {
      stdout: "",
      stderr: `Invalid --role "${role}". Valid roles: general-contractor, subcontractor, sub-subcontractor, material-supplier, laborer.`,
      exitCode: 2,
    };
  }

  const input: DeadlineInput = {
    state: flags["state"]!.toUpperCase(),
    role,
    firstFurnishingDate: flags["first"]!,
    ...(flags["last"] ? { lastFurnishingDate: flags["last"] } : {}),
    ...(flags["completion"] ? { completionDate: flags["completion"] } : {}),
    ...(flags["noc"] ? { noticeOfCompletionDate: flags["noc"] } : {}),
  };

  try {
    const schedule = calculateSchedule(input);
    const stdout = bools.has("json")
      ? JSON.stringify(schedule, null, 2)
      : formatScheduleText(schedule);
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err) {
    if (err instanceof CalculationError) {
      const hint =
        err.code === "UNSUPPORTED_STATE"
          ? ` Supported states: ${supportedStates().join(", ")}.`
          : "";
      return { stdout: "", stderr: `${err.message}${hint}`, exitCode: 1 };
    }
    return { stdout: "", stderr: `Unexpected error: ${(err as Error).message}`, exitCode: 1 };
  }
}

export { HELP };
