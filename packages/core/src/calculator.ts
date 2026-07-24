/**
 * The deadline calculator — the heart of the Free tier.
 *
 * Pure and stateless: given a `DeadlineInput` and the loaded rule registry, it
 * returns a fully-computed, sorted `DeadlineSchedule`. No I/O, no clock, no
 * randomness — the same input always yields the same output, which is what
 * makes it exhaustively testable and safe to depend on legally.
 */
import { addDays, formatIsoDate, parseIsoDate, type IsoDate } from "./dates.js";
import { rollToBusinessDay } from "./holidays.js";
import { getRuleSet, supportedStates } from "./rules/index.js";
import { LEGAL_DISCLAIMER } from "./disclaimer.js";
import { CLAIMANT_ROLES, SEVERITY_RANK } from "./types.js";
import { ENGINE_VERSION, RULESET_VERSION } from "./version.js";
import type {
  AnchorField,
  ClaimantRole,
  DeadlineInput,
  DeadlineItem,
  DeadlineSchedule,
} from "./types.js";

/** Thrown when a calculation cannot proceed due to invalid input. */
export class CalculationError extends Error {
  constructor(
    message: string,
    /** Machine-readable code for API/CLI callers to branch on. */
    readonly code:
      | "UNSUPPORTED_STATE"
      | "INVALID_ROLE"
      | "MISSING_REQUIRED_DATE"
      | "INVALID_DATE",
  ) {
    super(message);
    this.name = "CalculationError";
  }
}

function readAnchor(input: DeadlineInput, anchor: AnchorField): IsoDate | undefined {
  return input[anchor];
}

/**
 * Compute the deadline schedule for a claimant.
 *
 * @throws {CalculationError} for unsupported state, invalid role, missing the
 *   mandatory first-furnishing date, or malformed dates.
 */
export function calculateSchedule(input: DeadlineInput): DeadlineSchedule {
  const ruleSet = getRuleSet(input.state);
  if (!ruleSet) {
    throw new CalculationError(
      `No rule set loaded for state "${input.state}". Supported: ${supportedStates().join(", ")}.`,
      "UNSUPPORTED_STATE",
    );
  }

  if (!CLAIMANT_ROLES.includes(input.role)) {
    throw new CalculationError(
      `Unknown claimant role "${input.role}". Valid roles: ${CLAIMANT_ROLES.join(", ")}.`,
      "INVALID_ROLE",
    );
  }

  if (!input.firstFurnishingDate) {
    throw new CalculationError(
      "firstFurnishingDate is required to compute any schedule.",
      "MISSING_REQUIRED_DATE",
    );
  }

  // Validate and parse every supplied date up front (parse-once): a malformed
  // optional date fails loudly, and each date is parsed a single time and reused
  // by the rule loop below.
  const anchorFields: AnchorField[] = [
    "firstFurnishingDate",
    "lastFurnishingDate",
    "completionDate",
    "noticeOfCompletionDate",
  ];
  const parsedAnchors = new Map<AnchorField, Date>();
  for (const field of anchorFields) {
    const value = readAnchor(input, field);
    if (value !== undefined && value !== "") {
      try {
        parsedAnchors.set(field, parseIsoDate(value));
      } catch {
        throw new CalculationError(
          `Field "${field}" is not a valid YYYY-MM-DD date: "${value}".`,
          "INVALID_DATE",
        );
      }
    }
  }

  const items: DeadlineItem[] = [];
  const skipped: DeadlineSchedule["skipped"] = [];

  for (const rule of ruleSet.rules) {
    if (!rule.appliesToRoles.includes(input.role)) continue;

    const anchorDate = parsedAnchors.get(rule.anchor);
    const anchorValue = readAnchor(input, rule.anchor);
    if (anchorDate === undefined || anchorValue === undefined) {
      skipped.push({
        ruleId: rule.id,
        title: rule.title,
        reason: `Requires "${rule.anchor}", which was not provided.`,
      });
      continue;
    }

    const rawDue = addDays(anchorDate, rule.offsetDays);
    const adjustedDue = rollToBusinessDay(rawDue, rule.businessDayAdjust);
    const rawDueIso = formatIsoDate(rawDue);
    const adjustedDueIso = formatIsoDate(adjustedDue);

    items.push({
      ruleId: rule.id,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      statuteCitation: rule.statuteCitation,
      dueDate: adjustedDueIso,
      rawDueDate: rawDueIso,
      adjustedForNonBusinessDay: adjustedDueIso !== rawDueIso,
      basis: { anchor: rule.anchor, anchorDate: anchorValue, offsetDays: rule.offsetDays },
    });
  }

  // Deterministic sort: earliest operative deadline first; ties broken by
  // severity (most urgent first) so a `critical` deadline is never buried under
  // a less-urgent one sharing its date; final tie-break on rule id.
  items.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0;
  });

  return {
    state: ruleSet.state,
    stateName: ruleSet.name,
    role: input.role,
    input,
    items,
    skipped,
    disclaimer: LEGAL_DISCLAIMER,
    meta: { engineVersion: ENGINE_VERSION, ruleSetVersion: RULESET_VERSION },
  };
}

/** Convenience type guard re-exported for consumers. */
export function isClaimantRole(value: string): value is ClaimantRole {
  return (CLAIMANT_ROLES as readonly string[]).includes(value);
}
