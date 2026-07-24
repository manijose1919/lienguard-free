/**
 * @lienguard/api — public surface.
 * Exports the app factory and request schema so higher tiers (Pro) can mount
 * additional routes on the same instance.
 */
export { buildApp, type BuildOptions } from "./app.js";
export { calculateRequestSchema, type CalculateRequest } from "./schema.js";
