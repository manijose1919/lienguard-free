import type { StateRuleSet } from "../types.js";

/**
 * California mechanics-lien deadlines (private works).
 *
 * Primary authorities:
 *  - Cal. Civ. Code sec. 8200-8216 (Preliminary Notice, 20 days).
 *  - Cal. Civ. Code sec. 8412 (direct contractor: lien within 90 days of
 *    completion, or 60 days after owner records Notice of Completion).
 *  - Cal. Civ. Code sec. 8414 (subcontractor/supplier: lien within 90 days of
 *    completion, or 30 days after Notice of Completion is recorded).
 *
 * These are the private-works private-property defaults. Public works and
 * bonded jobs follow different tracks (stop-notice / bond-claim) and are out of
 * scope for the Free tier.
 */
export const CALIFORNIA: StateRuleSet = {
  state: "CA",
  name: "California",
  rules: [
    {
      id: "ca-preliminary-notice",
      title: "Serve Preliminary Notice",
      description:
        "Serve a 20-day Preliminary Notice on the owner, direct contractor, and " +
        "construction lender to preserve lien, stop-notice, and bond rights. Late " +
        "service limits recovery to work furnished in the 20 days before service.",
      severity: "critical",
      statuteCitation: "Cal. Civ. Code sec. 8200-8204",
      anchor: "firstFurnishingDate",
      offsetDays: 20,
      appliesToRoles: ["subcontractor", "sub-subcontractor", "material-supplier", "laborer"],
      businessDayAdjust: "next",
    },
    {
      id: "ca-lien-completion",
      title: "Record Mechanics Lien (from completion)",
      description:
        "If no Notice of Completion or Cessation is recorded, record the claim of " +
        "mechanics lien within 90 days after actual completion of the work of " +
        "improvement.",
      severity: "critical",
      statuteCitation: "Cal. Civ. Code sec. 8412, 8414",
      anchor: "completionDate",
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
    {
      id: "ca-lien-after-noc-direct",
      title: "Record Mechanics Lien (direct contractor, after NOC)",
      description:
        "If the owner records a Notice of Completion or Cessation, a direct " +
        "(general) contractor must record the lien within 60 days after that " +
        "recording.",
      severity: "critical",
      statuteCitation: "Cal. Civ. Code sec. 8412",
      anchor: "noticeOfCompletionDate",
      offsetDays: 60,
      appliesToRoles: ["general-contractor"],
      businessDayAdjust: "next",
    },
    {
      id: "ca-lien-after-noc-sub",
      title: "Record Mechanics Lien (sub/supplier, after NOC)",
      description:
        "If the owner records a Notice of Completion or Cessation, a subcontractor " +
        "or material supplier must record the lien within 30 days after that " +
        "recording.",
      severity: "critical",
      statuteCitation: "Cal. Civ. Code sec. 8414",
      anchor: "noticeOfCompletionDate",
      offsetDays: 30,
      appliesToRoles: ["subcontractor", "sub-subcontractor", "material-supplier", "laborer"],
      businessDayAdjust: "next",
    },
  ],
};
