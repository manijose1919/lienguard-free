import { describe, it, expect } from "vitest";
import { calculateSchedule, CalculationError } from "./calculator.js";
import type { DeadlineInput } from "./types.js";

function ca(overrides: Partial<DeadlineInput> = {}): DeadlineInput {
  return {
    state: "CA",
    role: "subcontractor",
    firstFurnishingDate: "2025-03-03",
    ...overrides,
  };
}

describe("calculateSchedule — happy path (California subcontractor)", () => {
  it("computes the preliminary notice and adjusts a Sunday deadline to Monday", () => {
    const schedule = calculateSchedule(ca());
    const prelim = schedule.items.find((i) => i.ruleId === "ca-preliminary-notice");
    expect(prelim).toBeDefined();
    expect(prelim?.rawDueDate).toBe("2025-03-23"); // Sunday (20 days after Mar 3)
    expect(prelim?.dueDate).toBe("2025-03-24"); // rolled to Monday
    expect(prelim?.adjustedForNonBusinessDay).toBe(true);
    expect(prelim?.basis).toEqual({
      anchor: "firstFurnishingDate",
      anchorDate: "2025-03-03",
      offsetDays: 20,
    });
  });

  it("skips lien rules whose anchor dates were not supplied", () => {
    const schedule = calculateSchedule(ca());
    const skippedIds = schedule.skipped.map((s) => s.ruleId);
    expect(skippedIds).toContain("ca-lien-completion");
    expect(skippedIds).toContain("ca-lien-after-noc-sub");
    // Each skip explains itself.
    expect(schedule.skipped[0]?.reason).toMatch(/Requires/);
  });

  it("always attaches the legal disclaimer", () => {
    const schedule = calculateSchedule(ca());
    expect(schedule.disclaimer).toMatch(/not legal advice/i);
    expect(schedule.disclaimer.length).toBeGreaterThan(100);
  });

  it("is deterministic — identical inputs produce identical output", () => {
    expect(calculateSchedule(ca())).toEqual(calculateSchedule(ca()));
  });

  it("stamps engine and rule-set versions for auditability", () => {
    const { meta } = calculateSchedule(ca());
    expect(meta.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(meta.ruleSetVersion).toBeTruthy();
  });
});

describe("calculateSchedule — role filtering", () => {
  it("does not issue a preliminary notice to a general contractor", () => {
    const schedule = calculateSchedule(ca({ role: "general-contractor" }));
    const ids = schedule.items.map((i) => i.ruleId);
    expect(ids).not.toContain("ca-preliminary-notice");
  });

  it("chains weekend + holiday rolls for a GC after-NOC lien", () => {
    const schedule = calculateSchedule(
      ca({ role: "general-contractor", noticeOfCompletionDate: "2025-07-01" }),
    );
    const lien = schedule.items.find((i) => i.ruleId === "ca-lien-after-noc-direct");
    // +60 days = Aug 30 (Sat) -> Sun -> Labor Day Mon Sep 1 -> Tue Sep 2
    expect(lien?.rawDueDate).toBe("2025-08-30");
    expect(lien?.dueDate).toBe("2025-09-02");
    expect(lien?.adjustedForNonBusinessDay).toBe(true);
  });
});

describe("calculateSchedule — Florida supplier ordering", () => {
  it("returns notice-to-owner then claim-of-lien, sorted by due date", () => {
    const schedule = calculateSchedule({
      state: "FL",
      role: "material-supplier",
      firstFurnishingDate: "2025-01-06",
      lastFurnishingDate: "2025-04-01",
    });
    expect(schedule.items.map((i) => i.ruleId)).toEqual([
      "fl-notice-to-owner",
      "fl-claim-of-lien",
    ]);
    expect(schedule.items[0]?.dueDate).toBe("2025-02-20"); // +45, a Thursday
    expect(schedule.items[1]?.dueDate).toBe("2025-06-30"); // +90, a Monday
    // Ascending order invariant.
    expect(schedule.items[0]!.dueDate < schedule.items[1]!.dueDate).toBe(true);
  });
});

describe("calculateSchedule — input validation", () => {
  it("rejects an unsupported state", () => {
    expect(() => calculateSchedule(ca({ state: "ZZ" }))).toThrowError(
      expect.objectContaining({ code: "UNSUPPORTED_STATE" }),
    );
  });

  it("rejects an invalid role", () => {
    // Cast through unknown to simulate an untrusted caller.
    const bad = ca({ role: "architect" as unknown as DeadlineInput["role"] });
    expect(() => calculateSchedule(bad)).toThrowError(
      expect.objectContaining({ code: "INVALID_ROLE" }),
    );
  });

  it("requires a first-furnishing date", () => {
    const bad = ca({ firstFurnishingDate: "" });
    expect(() => calculateSchedule(bad)).toThrowError(
      expect.objectContaining({ code: "MISSING_REQUIRED_DATE" }),
    );
  });

  it("rejects a malformed optional date instead of ignoring it", () => {
    const bad = ca({ completionDate: "2025-02-30" });
    expect(() => calculateSchedule(bad)).toThrowError(
      expect.objectContaining({ code: "INVALID_DATE" }),
    );
  });

  it("throws a typed CalculationError", () => {
    try {
      calculateSchedule(ca({ state: "ZZ" }));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CalculationError);
    }
  });
});
