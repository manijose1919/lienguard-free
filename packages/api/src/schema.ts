/**
 * Request validation for the calculate endpoint.
 *
 * The core engine trusts its typed inputs; this schema is the gate that turns
 * untrusted JSON into a valid `DeadlineInput`. Validating here (not in core)
 * keeps the engine dependency-free and gives one authoritative contract for
 * every HTTP caller.
 */
import { z } from "zod";
import { parseIsoDate, CLAIMANT_ROLES } from "@lienguard/core";

/** A strict `YYYY-MM-DD` string that also names a real calendar date. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be formatted as YYYY-MM-DD")
  .refine(
    (value) => {
      try {
        parseIsoDate(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "is not a real calendar date" },
  );

// zod's enum needs a non-empty readonly tuple; assert the core constant into one.
const roleEnum = z.enum(CLAIMANT_ROLES as unknown as [string, ...string[]]);

export const calculateRequestSchema = z
  .object({
    state: z
      .string()
      .trim()
      .length(2, "state must be a two-letter USPS code")
      .transform((s) => s.toUpperCase()),
    role: roleEnum,
    firstFurnishingDate: isoDate,
    lastFurnishingDate: isoDate.optional(),
    completionDate: isoDate.optional(),
    noticeOfCompletionDate: isoDate.optional(),
  })
  .strict(); // reject unknown fields — no silent typo tolerance

/** The validated, typed request body. */
export type CalculateRequest = z.infer<typeof calculateRequestSchema>;
