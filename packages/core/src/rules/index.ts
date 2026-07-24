/**
 * The rule-set registry.
 *
 * The Free tier ships three pilot jurisdictions. The Pro tier extends this
 * registry with the remaining states by registering additional `StateRuleSet`
 * objects — no engine changes required. Keeping registration data-driven is
 * what lets the same calculator serve 3 states or 50.
 */
import type { StateCode, StateRuleSet } from "../types.js";
import { CALIFORNIA } from "./california.js";
import { FLORIDA } from "./florida.js";
import { TEXAS } from "./texas.js";

const REGISTRY = new Map<StateCode, StateRuleSet>();

/** Register (or override) a jurisdiction's rule set. */
export function registerRuleSet(ruleSet: StateRuleSet): void {
  REGISTRY.set(ruleSet.state.toUpperCase(), ruleSet);
}

/** Look up a rule set by USPS state code (case-insensitive). */
export function getRuleSet(state: StateCode): StateRuleSet | undefined {
  return REGISTRY.get(state.toUpperCase());
}

/** List the state codes that currently have a loaded rule set. */
export function supportedStates(): StateCode[] {
  return [...REGISTRY.keys()].sort();
}

// Register the Free-tier pilot states at module load.
registerRuleSet(CALIFORNIA);
registerRuleSet(TEXAS);
registerRuleSet(FLORIDA);

export { CALIFORNIA, TEXAS, FLORIDA };
