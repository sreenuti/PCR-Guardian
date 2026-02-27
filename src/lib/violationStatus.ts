/**
 * Server-side violation status calculation.
 * Fines accrue at $50/day after the grace period; projected 30-day total is $1,500.
 */

const FINE_PER_DAY = 50;
const PROJECTED_30_DAY_TOTAL = 1500;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ViolationStatusInput {
  /** Date the violation notice was issued (Date or ISO string). */
  noticeDate: Date | string;
  /** Number of days in the grace period. */
  gracePeriodDays: number;
  /** Optional date to calculate as of; defaults to today. */
  asOfDate?: Date | string;
}

export interface ViolationStatus {
  /** Days elapsed since the grace period ended. */
  days_past_grace_period: number;
  /** Total fines accrued so far ($50/day). */
  total_accrued_fines: number;
  /** Projected total if violation continues 30 days past grace ($1,500). */
  projected_30_day_total: number;
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/**
 * Calculates violation status: days past grace period, accrued fines, and projected 30-day total.
 */
export function getViolationStatus(input: ViolationStatusInput): ViolationStatus {
  const notice = toDate(input.noticeDate);
  const asOf = input.asOfDate ? toDate(input.asOfDate) : new Date();

  const graceEnd = new Date(notice);
  graceEnd.setDate(graceEnd.getDate() + input.gracePeriodDays);

  const daysPastGrace = Math.max(
    0,
    Math.floor((asOf.getTime() - graceEnd.getTime()) / MS_PER_DAY)
  );

  const total_accrued_fines = daysPastGrace * FINE_PER_DAY;

  return {
    days_past_grace_period: daysPastGrace,
    total_accrued_fines,
    projected_30_day_total: PROJECTED_30_DAY_TOTAL,
  };
}
