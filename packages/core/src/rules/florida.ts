import type { StateRuleSet } from "../types.js";

/**
 * Florida construction-lien deadlines (private works).
 *
 * Primary authorities:
 *  - Fla. Stat. sec. 713.06(2)(a): a lienor NOT in privity with the owner must
 *    serve a Notice to Owner within 45 days of first furnishing.
 *  - Fla. Stat. sec. 713.08(5): the Claim of Lien must be recorded within 90
 *    days after final furnishing of labor, services, or materials.
 *  - Fla. Stat. sec. 713.06(3)(d): a Contractor's Final Payment Affidavit must
 *    be served on the owner at least 5 days before filing suit to enforce.
 */
export const FLORIDA: StateRuleSet = {
  state: "FL",
  name: "Florida",
  rules: [
    {
      id: "fl-notice-to-owner",
      title: "Serve Notice to Owner",
      description:
        "Lienors not in direct privity with the owner must serve a Notice to Owner " +
        "within 45 days of first furnishing labor or materials, before final " +
        "payment to the contractor. Failure is a complete defense to the lien.",
      severity: "critical",
      statuteCitation: "Fla. Stat. sec. 713.06(2)(a)",
      anchor: "firstFurnishingDate",
      offsetDays: 45,
      appliesToRoles: ["subcontractor", "sub-subcontractor", "material-supplier"],
      businessDayAdjust: "next",
    },
    {
      id: "fl-claim-of-lien",
      title: "Record Claim of Lien",
      description:
        "Record the Claim of Lien in the county records within 90 days after the " +
        "final furnishing of labor, services, or materials to the project.",
      severity: "critical",
      statuteCitation: "Fla. Stat. sec. 713.08(5)",
      anchor: "lastFurnishingDate",
      offsetDays: 90,
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
