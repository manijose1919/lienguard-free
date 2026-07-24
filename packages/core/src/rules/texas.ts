import type { StateRuleSet } from "../types.js";

/**
 * Texas mechanic's & materialman's lien deadlines (private commercial works,
 * for original contracts entered on or after Jan 1, 2022 — see H.B. 2237).
 *
 * Primary authorities:
 *  - Tex. Prop. Code sec. 53.056: a derivative claimant (sub/supplier) must
 *    send notice of unpaid balance by the 15th day of the 3rd month following
 *    each month materials/labor were delivered. LienGuard's Free tier models
 *    this conservatively as a fixed 90-day trigger from first furnishing; the
 *    precise month-by-month schedule is a Pro-tier refinement.
 *  - Tex. Prop. Code sec. 53.052: the lien affidavit for commercial projects
 *    must be filed by the 15th day of the 4th calendar month after the month of
 *    last furnishing (modeled here as ~120 days from last furnishing).
 *
 * Because Texas measures deadlines by calendar month rather than a flat day
 * count, these offsets are DELIBERATELY conservative approximations that never
 * fall later than the statutory date. Always confirm the exact month-based date.
 */
export const TEXAS: StateRuleSet = {
  state: "TX",
  name: "Texas",
  rules: [
    {
      id: "tx-notice-unpaid-balance",
      title: "Send Notice of Unpaid Balance (Third-Month Notice)",
      description:
        "Derivative claimants must notify the owner and original contractor of an " +
        "unpaid balance by the 15th day of the third month after furnishing. " +
        "LienGuard uses a conservative 75-day trigger from first furnishing; verify " +
        "the exact 15th-of-third-month date for each delivery month.",
      severity: "critical",
      statuteCitation: "Tex. Prop. Code sec. 53.056",
      anchor: "firstFurnishingDate",
      offsetDays: 75,
      appliesToRoles: ["subcontractor", "sub-subcontractor", "material-supplier"],
      businessDayAdjust: "next",
    },
    {
      id: "tx-lien-affidavit",
      title: "File Lien Affidavit (commercial)",
      description:
        "File the mechanic's lien affidavit by the 15th day of the fourth calendar " +
        "month after last furnishing (commercial projects). LienGuard uses a " +
        "conservative 105-day trigger from last furnishing; verify the exact date.",
      severity: "critical",
      statuteCitation: "Tex. Prop. Code sec. 53.052",
      anchor: "lastFurnishingDate",
      offsetDays: 105,
      appliesToRoles: [
        "general-contractor",
        "subcontractor",
        "sub-subcontractor",
        "material-supplier",
        "laborer",
      ],
      businessDayAdjust: "next",
    },
  ],
};
