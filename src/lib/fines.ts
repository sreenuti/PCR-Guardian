import type { Violation, HardCost } from "@/types/database";

export const FINE_RATE_PER_DAY = 50;
export const FINE_START_DAY_OFFSET = 10;
export const SETTLEMENT_FINE_PERCENT = 0.1;

/**
 * Meter start = violation_date + 10 days (accrual starts on day 11).
 * Returns the number of calendar days that have accrued fines as of `asOf`.
 */
function getAccruedDays(
  violationDate: string,
  asOf: Date,
  curePhotoUploadedAt: string | null
): number {
  const violation = new Date(violationDate + "T00:00:00Z");
  const meterStart = new Date(violation);
  meterStart.setUTCDate(meterStart.getUTCDate() + FINE_START_DAY_OFFSET);

  const end = curePhotoUploadedAt ? new Date(curePhotoUploadedAt) : asOf;
  if (end < meterStart) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor(
    (end.getTime() - meterStart.getTime()) / msPerDay
  );
  return Math.max(0, days);
}

/**
 * Get accrued fine total for a violation.
 * If is_accruing is false, returns the locked fine_balance.
 * Otherwise computes accrued days up to asOf (default now) * FINE_RATE_PER_DAY.
 */
export function getAccruedFineTotal(
  violation: Violation,
  asOf: Date = new Date()
): number {
  if (!violation.is_accruing) {
    return Number(violation.fine_balance);
  }
  const days = getAccruedDays(
    violation.violation_date,
    asOf,
    violation.cure_photo_uploaded_at
  );
  return days * FINE_RATE_PER_DAY;
}

/**
 * 90/10 rule: proposed settlement = 10% of accrued fines + 100% of hard costs.
 */
export function getProposedSettlement(
  violation: Violation,
  hardCosts: HardCost[],
  asOf: Date = new Date()
): number {
  const accruedTotal = getAccruedFineTotal(violation, asOf);
  const finePortion = accruedTotal * SETTLEMENT_FINE_PERCENT;
  const totalHardCosts = hardCosts.reduce((sum, h) => sum + Number(h.amount), 0);
  return finePortion + totalHardCosts;
}

/**
 * Compute the locked fine balance as of a given timestamp (e.g. cure_photo_uploaded_at).
 * Used when applying stop-clock to set fine_balance and is_accruing = false.
 */
export function computeBalanceAtTimestamp(
  violation: Violation,
  at: Date
): number {
  const days = getAccruedDays(
    violation.violation_date,
    at,
    null
  );
  return days * FINE_RATE_PER_DAY;
}

export type CurePhotoResult = {
  fine_balance: number;
  is_accruing: false;
};

/**
 * Returns the values to persist when applying cure photo (stop-clock):
 * fine_balance = accrued total at `at`, is_accruing = false.
 * Caller should persist these and set cure_photo_uploaded_at = at.
 */
export function applyCurePhotoUpload(
  violation: Violation,
  at: Date = new Date()
): CurePhotoResult {
  const balance = computeBalanceAtTimestamp(violation, at);
  return { fine_balance: balance, is_accruing: false };
}
