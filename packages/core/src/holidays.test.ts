import { describe, it, expect } from "vitest";
import { parseIsoDate } from "./dates.js";
import {
  federalHolidays,
  isFederalHoliday,
  isBusinessDay,
  rollToBusinessDay,
} from "./holidays.js";

describe("federalHolidays 2025", () => {
  const holidays = federalHolidays(2025);
  const expected = [
    "2025-01-01", // New Year's Day (Wed)
    "2025-01-20", // MLK Jr. Day (3rd Mon)
    "2025-02-17", // Washington's Birthday (3rd Mon)
    "2025-05-26", // Memorial Day (last Mon)
    "2025-06-19", // Juneteenth (Thu)
    "2025-07-04", // Independence Day (Fri)
    "2025-09-01", // Labor Day (1st Mon)
    "2025-10-13", // Columbus Day (2nd Mon)
    "2025-11-11", // Veterans Day (Tue)
    "2025-11-27", // Thanksgiving (4th Thu)
    "2025-12-25", // Christmas (Thu)
  ];

  it("computes all eleven observed dates", () => {
    expect([...holidays].sort()).toEqual([...expected].sort());
  });
});

describe("weekend observation rules", () => {
  it("observes July 4, 2021 (Sun) on Monday July 5", () => {
    expect(isFederalHoliday(parseIsoDate("2021-07-05"))).toBe(true);
    expect(isFederalHoliday(parseIsoDate("2021-07-04"))).toBe(false);
  });

  it("observes Christmas 2021 (Sat) on Friday Dec 24", () => {
    expect(isFederalHoliday(parseIsoDate("2021-12-24"))).toBe(true);
  });

  it("observes New Year 2022 (Sat) on Friday Dec 31, 2021 (prior year)", () => {
    expect(isFederalHoliday(parseIsoDate("2021-12-31"))).toBe(true);
  });
});

describe("isBusinessDay", () => {
  it("is false on weekends and holidays, true on ordinary weekdays", () => {
    expect(isBusinessDay(parseIsoDate("2025-07-04"))).toBe(false); // holiday
    expect(isBusinessDay(parseIsoDate("2025-07-05"))).toBe(false); // Saturday
    expect(isBusinessDay(parseIsoDate("2025-07-07"))).toBe(true); // Monday
  });
});

describe("rollToBusinessDay", () => {
  it("rolls a Saturday deadline forward to Monday", () => {
    // 2025-03-15 is a Saturday -> Monday 2025-03-17
    const rolled = rollToBusinessDay(parseIsoDate("2025-03-15"), "next");
    expect(rolled.getUTCDate()).toBe(17);
  });

  it("rolls forward over a holiday weekend", () => {
    // July 4, 2025 (Fri, holiday) -> skip Sat/Sun -> Monday July 7
    const rolled = rollToBusinessDay(parseIsoDate("2025-07-04"), "next");
    expect(rolled.getUTCFullYear()).toBe(2025);
    expect(rolled.getUTCMonth()).toBe(6);
    expect(rolled.getUTCDate()).toBe(7);
  });

  it("rolls backward with 'previous'", () => {
    // Saturday 2025-03-15 -> Friday 2025-03-14
    const rolled = rollToBusinessDay(parseIsoDate("2025-03-15"), "previous");
    expect(rolled.getUTCDate()).toBe(14);
  });

  it("leaves a business day unchanged and respects 'none'", () => {
    const monday = parseIsoDate("2025-03-17");
    expect(rollToBusinessDay(monday, "next").getUTCDate()).toBe(17);
    expect(rollToBusinessDay(parseIsoDate("2025-03-15"), "none").getUTCDate()).toBe(15);
  });
});
