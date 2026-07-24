/**
 * U.S. federal holiday calendar and business-day arithmetic.
 *
 * Deadlines that fall on a weekend or legal holiday are, in most U.S.
 * jurisdictions, rolled forward to the next business day (see e.g. Cal. Civ.
 * Proc. Code sec. 12a; Fed. R. Civ. P. 6(a)). This module computes the eleven
 * U.S. federal holidays for any given year — including their *observed* dates
 * when the holiday falls on a weekend — and provides business-day rolling.
 *
 * NOTE: State-specific holidays (e.g. California's Cesar Chavez Day) are not
 * modeled here; only the federal set is. Jurisdiction-specific holiday tables
 * are a Pro-tier concern.
 */

import { addDays, dayOfWeek, formatIsoDate, isWeekend, type IsoDate } from "./dates.js";

/** Return the date of the `n`-th `weekday` in a given month (1-indexed n). */
function nthWeekdayOfMonth(year: number, month0: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, month0, 1));
  const firstDow = first.getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(Date.UTC(year, month0, day));
}

/** Return the date of the last `weekday` in a given month. */
function lastWeekdayOfMonth(year: number, month0: number, weekday: number): Date {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const last = new Date(Date.UTC(year, month0, lastDay));
  const lastDow = last.getUTCDay();
  const offset = (lastDow - weekday + 7) % 7;
  return new Date(Date.UTC(year, month0, lastDay - offset));
}

/**
 * Apply the federal observation rule for a fixed-date holiday: if it lands on
 * Saturday it is observed the preceding Friday; on Sunday, the following Monday.
 */
function observedFixedDate(year: number, month0: number, day: number): Date {
  const date = new Date(Date.UTC(year, month0, day));
  const dow = date.getUTCDay();
  if (dow === 6) return addDays(date, -1); // Saturday -> Friday
  if (dow === 0) return addDays(date, 1); // Sunday -> Monday
  return date;
}

/**
 * Compute the observed dates of all U.S. federal holidays for `year`.
 * Returns a Set of ISO date strings for O(1) membership checks.
 */
export function federalHolidays(year: number): Set<IsoDate> {
  const dates: Date[] = [
    observedFixedDate(year, 0, 1), // New Year's Day — Jan 1
    nthWeekdayOfMonth(year, 0, 1, 3), // MLK Jr. Day — 3rd Mon Jan
    nthWeekdayOfMonth(year, 1, 1, 3), // Washington's Birthday — 3rd Mon Feb
    lastWeekdayOfMonth(year, 4, 1), // Memorial Day — last Mon May
    observedFixedDate(year, 5, 19), // Juneteenth — Jun 19
    observedFixedDate(year, 6, 4), // Independence Day — Jul 4
    nthWeekdayOfMonth(year, 8, 1, 1), // Labor Day — 1st Mon Sep
    nthWeekdayOfMonth(year, 9, 1, 2), // Columbus Day — 2nd Mon Oct
    observedFixedDate(year, 10, 11), // Veterans Day — Nov 11
    nthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving — 4th Thu Nov
    observedFixedDate(year, 11, 25), // Christmas Day — Dec 25
  ];
  return new Set(dates.map(formatIsoDate));
}

// Small bounded cache so repeated lookups in the same year don't recompute the
// table. The bound prevents unbounded growth if a caller passes calculations
// spanning many arbitrary years (e.g. hostile far-future/past input).
const holidayCache = new Map<number, Set<IsoDate>>();
const HOLIDAY_CACHE_MAX = 64;

function holidaysForYear(year: number): Set<IsoDate> {
  let set = holidayCache.get(year);
  if (!set) {
    if (holidayCache.size >= HOLIDAY_CACHE_MAX) {
      // Evict the oldest entry (Map preserves insertion order).
      const oldest = holidayCache.keys().next().value;
      if (oldest !== undefined) holidayCache.delete(oldest);
    }
    set = federalHolidays(year);
    holidayCache.set(year, set);
  }
  return set;
}

/** True if `date` is a federal holiday (observed). */
export function isFederalHoliday(date: Date): boolean {
  const year = date.getUTCFullYear();
  const iso = formatIsoDate(date);
  // Check the date's own year AND the next year: when Jan 1 falls on a
  // Saturday it is observed on Dec 31 of the PRIOR year, so a late-December
  // date can be next year's observed New Year's Day.
  return holidaysForYear(year).has(iso) || holidaysForYear(year + 1).has(iso);
}

/** A business day is a weekday that is not an observed federal holiday. */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isFederalHoliday(date);
}

/** How a non-business-day deadline should be rolled. */
export type BusinessDayAdjustment = "none" | "next" | "previous";

/**
 * Roll `date` to a business day per `adjustment`.
 * - "none": returned unchanged.
 * - "next": rolled forward to the next business day (the common statutory rule).
 * - "previous": rolled backward to the prior business day.
 * Includes a safety bound so a misconfigured calendar can never infinite-loop.
 */
export function rollToBusinessDay(date: Date, adjustment: BusinessDayAdjustment): Date {
  if (adjustment === "none") return date;
  const step = adjustment === "next" ? 1 : -1;

  let cursor = date;
  for (let guard = 0; guard < 30; guard++) {
    if (isBusinessDay(cursor)) return cursor;
    cursor = addDays(cursor, step);
  }
  // Unreachable in practice: no 30-day run is entirely non-business days.
  throw new Error("rollToBusinessDay exceeded safety bound; check holiday table.");
}

/** True if `dow` (0-6) names a weekend day. Exposed for completeness/testing. */
export function weekendDay(dow: number): boolean {
  return dow === 0 || dow === 6;
}

export { dayOfWeek };
