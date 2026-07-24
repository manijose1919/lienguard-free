import { describe, it, expect } from "vitest";
import {
  parseIsoDate,
  formatIsoDate,
  addDays,
  isWeekend,
  differenceInDays,
  InvalidDateError,
} from "./dates.js";

describe("parseIsoDate", () => {
  it("parses a valid date to UTC midnight", () => {
    const d = parseIsoDate("2025-03-14");
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(2);
    expect(d.getUTCDate()).toBe(14);
    expect(d.getUTCHours()).toBe(0);
  });

  it("accepts a valid leap day", () => {
    expect(() => parseIsoDate("2024-02-29")).not.toThrow();
  });

  it("rejects a non-leap-year Feb 29", () => {
    expect(() => parseIsoDate("2025-02-29")).toThrow(InvalidDateError);
  });

  it("rejects an impossible calendar date (no silent rollover)", () => {
    expect(() => parseIsoDate("2025-02-30")).toThrow(InvalidDateError);
    expect(() => parseIsoDate("2025-13-01")).toThrow(InvalidDateError);
    expect(() => parseIsoDate("2025-04-31")).toThrow(InvalidDateError);
  });

  it("rejects malformed strings", () => {
    for (const bad of ["", "2025-3-14", "03/14/2025", "2025-03-14T00:00", "abcd-ef-gh"]) {
      expect(() => parseIsoDate(bad)).toThrow(InvalidDateError);
    }
  });
});

describe("formatIsoDate", () => {
  it("round-trips with parseIsoDate", () => {
    for (const iso of ["2025-01-01", "2024-02-29", "1999-12-31", "2100-06-15"]) {
      expect(formatIsoDate(parseIsoDate(iso))).toBe(iso);
    }
  });
});

describe("addDays", () => {
  it("adds across a month boundary", () => {
    expect(formatIsoDate(addDays(parseIsoDate("2025-01-25"), 10))).toBe("2025-02-04");
  });

  it("adds across a year boundary", () => {
    expect(formatIsoDate(addDays(parseIsoDate("2025-12-28"), 5))).toBe("2026-01-02");
  });

  it("handles negative offsets", () => {
    expect(formatIsoDate(addDays(parseIsoDate("2025-03-01"), -1))).toBe("2025-02-28");
  });

  it("crosses a leap day correctly", () => {
    expect(formatIsoDate(addDays(parseIsoDate("2024-02-28"), 1))).toBe("2024-02-29");
  });

  it("rejects a non-integer offset", () => {
    expect(() => addDays(parseIsoDate("2025-01-01"), 1.5)).toThrow(RangeError);
  });
});

describe("isWeekend", () => {
  it("identifies Saturday and Sunday", () => {
    expect(isWeekend(parseIsoDate("2025-03-15"))).toBe(true); // Sat
    expect(isWeekend(parseIsoDate("2025-03-16"))).toBe(true); // Sun
    expect(isWeekend(parseIsoDate("2025-03-17"))).toBe(false); // Mon
  });
});

describe("differenceInDays", () => {
  it("counts whole days between two dates", () => {
    expect(differenceInDays(parseIsoDate("2025-01-01"), parseIsoDate("2025-01-21"))).toBe(20);
  });
});
