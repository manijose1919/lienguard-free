/**
 * @lienguard/core — public API surface.
 *
 * This is the entire Free-tier engine: a pure, dependency-free deadline
 * calculator. Everything the CLI, API, Premium, and Pro packages build on is
 * exported here.
 */

// Date utilities
export {
  parseIsoDate,
  formatIsoDate,
  addDays,
  dayOfWeek,
  isWeekend,
  differenceInDays,
  InvalidDateError,
  type IsoDate,
} from "./dates.js";

// Holiday / business-day calendar
export {
  federalHolidays,
  isFederalHoliday,
  isBusinessDay,
  rollToBusinessDay,
  type BusinessDayAdjustment,
} from "./holidays.js";

// Domain types
export type {
  ClaimantRole,
  StateCode,
  AnchorField,
  Severity,
  DeadlineInput,
  DeadlineRule,
  StateRuleSet,
  DeadlineItem,
  DeadlineSchedule,
} from "./types.js";
export { CLAIMANT_ROLES, SEVERITY_RANK } from "./types.js";

// Version stamps
export { ENGINE_VERSION, RULESET_VERSION } from "./version.js";

// Rule registry
export {
  getRuleSet,
  registerRuleSet,
  supportedStates,
  CALIFORNIA,
  TEXAS,
  FLORIDA,
} from "./rules/index.js";

// The calculator
export { calculateSchedule, isClaimantRole, CalculationError } from "./calculator.js";

// The disclaimer
export { LEGAL_DISCLAIMER } from "./disclaimer.js";
