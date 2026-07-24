/**
 * Version stamps for auditability.
 *
 * A computed schedule embeds these so a stored result can be traced back to the
 * exact engine and rule-set revision that produced it. They are intentionally
 * static constants (not timestamps) so the engine stays deterministic: the same
 * input always yields byte-identical output.
 */

/** Bumped when calculator logic changes in a way that can alter output. */
export const ENGINE_VERSION = "1.0.0";

/** Bumped when any statutory rule value changes. */
export const RULESET_VERSION = "2025.1";
