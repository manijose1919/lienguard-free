/**
 * UTC-only calendar-date utilities.
 *
 * All dates in LienGuard are handled as calendar dates (no time-of-day, no
 * timezone). We represent them internally as `Date` objects pinned to UTC
 * midnight and as ISO `YYYY-MM-DD` strings at the boundary. Working in UTC
 * removes an entire class of off-by-one bugs that arise when local-time
 * arithmetic crosses a daylight-saving boundary.
 */

/** An ISO calendar date, e.g. "2025-03-14". */
export type IsoDate = string;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Error thrown when a value cannot be interpreted as a calendar date. */
export class InvalidDateError extends Error {
  constructor(value: string) {
    super(`Invalid calendar date: "${value}". Expected format YYYY-MM-DD.`);
    this.name = "InvalidDateError";
  }
}

/**
 * Parse a strict `YYYY-MM-DD` string into a UTC-midnight `Date`.
 *
 * Rejects malformed strings AND impossible dates (e.g. 2025-02-30), because
 * JavaScript's `Date` silently rolls those over — a foot-gun we refuse to ship
 * in a legal-deadline tool.
 */
export function parseIsoDate(value: string): Date {
  const match = ISO_DATE_RE.exec(value);
  if (!match) throw new InvalidDateError(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject rollovers: if the components don't survive a round trip, the input
  // named a date that does not exist on the calendar.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidDateError(value);
  }

  return date;
}

/** Format a UTC `Date` back into an ISO `YYYY-MM-DD` string. */
export function formatIsoDate(date: Date): IsoDate {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Return a new date `days` calendar days after (or before, if negative) `date`. */
export function addDays(date: Date, days: number): Date {
  if (!Number.isInteger(days)) {
    throw new RangeError(`addDays expects an integer, received ${days}`);
  }
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** 0 = Sunday, 1 = Monday, ... 6 = Saturday (UTC). */
export function dayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/** True for Saturday (6) and Sunday (0). */
export function isWeekend(date: Date): boolean {
  const dow = dayOfWeek(date);
  return dow === 0 || dow === 6;
}

/** Whole-day difference `b - a` (calendar days). */
export function differenceInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}
