/**
 * Domain model for LienGuard's deadline engine.
 *
 * A `StateRuleSet` declaratively encodes one jurisdiction's statutory notice
 * and lien deadlines. The calculator applies a rule set to a claimant's
 * `DeadlineInput` and produces a `DeadlineSchedule`.
 */

import type { IsoDate } from "./dates.js";
import type { BusinessDayAdjustment } from "./holidays.js";

/** The role a claimant plays on the project. Deadlines differ by role. */
export type ClaimantRole =
  | "general-contractor"
  | "subcontractor"
  | "sub-subcontractor"
  | "material-supplier"
  | "laborer";

export const CLAIMANT_ROLES: readonly ClaimantRole[] = [
  "general-contractor",
  "subcontractor",
  "sub-subcontractor",
  "material-supplier",
  "laborer",
];

/** Two-letter USPS state code. Only states with a loaded rule set are valid. */
export type StateCode = string;

/**
 * A date field on the claimant's input that a rule can anchor to.
 * Every deadline is computed as `anchor date + offset`.
 */
export type AnchorField =
  | "firstFurnishingDate"
  | "lastFurnishingDate"
  | "completionDate"
  | "noticeOfCompletionDate";

/** How serious it is to miss a given deadline. */
export type Severity = "critical" | "important" | "informational";

/** Inputs a claimant provides to compute their schedule. */
export interface DeadlineInput {
  /** Jurisdiction (USPS code) governing the project. */
  state: StateCode;
  /** The claimant's role on the project. */
  role: ClaimantRole;
  /** Date the claimant first furnished labor or materials. */
  firstFurnishingDate: IsoDate;
  /** Date of last furnishing (used by lien-recording deadlines). */
  lastFurnishingDate?: IsoDate;
  /** Date the overall project was completed. */
  completionDate?: IsoDate;
  /** Date a Notice of Completion/Cessation was recorded, if any. */
  noticeOfCompletionDate?: IsoDate;
}

/** A single declarative deadline rule within a state's rule set. */
export interface DeadlineRule {
  /** Stable identifier, unique within a rule set (e.g. "ca-prelim-notice"). */
  id: string;
  /** Human-readable deadline name. */
  title: string;
  /** What the claimant must do by this date, and why it matters. */
  description: string;
  severity: Severity;
  /** Statutory citation this rule encodes (for auditability). */
  statuteCitation: string;
  /** The input date this deadline is measured from. */
  anchor: AnchorField;
  /** Number of calendar days after the anchor the deadline falls. */
  offsetDays: number;
  /** Roles this rule applies to. */
  appliesToRoles: readonly ClaimantRole[];
  /** How to adjust when the raw due date lands on a weekend/holiday. */
  businessDayAdjust: BusinessDayAdjustment;
}

/** A jurisdiction's complete set of deadline rules. */
export interface StateRuleSet {
  /** USPS state code. */
  state: StateCode;
  /** Full state name. */
  name: string;
  /** The deadline rules, in no particular order (calculator sorts output). */
  rules: readonly DeadlineRule[];
}

/** Ranking used to break sort ties: lower number = more urgent. */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  important: 1,
  informational: 2,
};

/** A computed deadline for a specific claimant. */
export interface DeadlineItem {
  /** The originating rule's id. */
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  statuteCitation: string;
  /** Due date after weekend/holiday adjustment (the operative deadline). */
  dueDate: IsoDate;
  /** Due date before adjustment (anchor + offset). */
  rawDueDate: IsoDate;
  /** Whether adjustment moved the date off a weekend/holiday. */
  adjustedForNonBusinessDay: boolean;
  /** Which anchor field and offset produced this deadline (audit trail). */
  basis: { anchor: AnchorField; anchorDate: IsoDate; offsetDays: number };
}

/** The full result of a calculation. */
export interface DeadlineSchedule {
  state: StateCode;
  stateName: string;
  role: ClaimantRole;
  /** The input the schedule was generated from (echoed for the record). */
  input: DeadlineInput;
  /** Deadlines sorted ascending by operative due date. */
  items: DeadlineItem[];
  /** Rules that could not be computed because a required anchor was absent. */
  skipped: { ruleId: string; title: string; reason: string }[];
  /** Standard legal disclaimer — always present. */
  disclaimer: string;
  /** Version stamps for reproducibility/auditability (static, deterministic). */
  meta: { engineVersion: string; ruleSetVersion: string };
}
