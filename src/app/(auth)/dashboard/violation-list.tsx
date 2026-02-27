import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurePhotoButton } from "./cure-photo-button";
import type { Violation, HardCost } from "@/types/database";

type ViolationWithTotals = {
  violation: Violation;
  hardCosts: HardCost[];
  accruedTotal: number;
  proposedSettlement: number;
};

export function ViolationList({
  violationsWithTotals,
  hasAnyAccruing,
}: {
  violationsWithTotals: ViolationWithTotals[];
  hasAnyAccruing: boolean;
}) {
  if (violationsWithTotals.length === 0) {
    return (
      <Card className="border-primary/20 bg-white/90 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No violations on file. Your fine meter will appear here when
            applicable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-900">
        Violations overview
      </h2>
      {violationsWithTotals.map(
        ({
          violation,
          hardCosts,
          accruedTotal,
          proposedSettlement,
        }) => (
          <Card
            key={violation.id}
            className="border-primary/15 bg-white/95 shadow-sm"
          >
            <CardHeader className="border-b border-primary/10 bg-secondary/40 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-sky-900/80">
                  {violation.violation_date}
                </span>
                <Badge
                  variant={violation.is_accruing ? "destructive" : "success"}
                >
                  {violation.is_accruing ? "Accruing" : "Stopped"}
                </Badge>
              </div>
              <p className="pt-1 text-sm font-semibold text-sky-950">
                {violation.description ?? "Violation"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <p className="text-sm">
                Current balance:{" "}
                <span className="font-semibold">
                  $
                  {accruedTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
              <p className="text-sm">
                Proposed settlement (90/10 + hard costs):{" "}
                <span className="font-semibold">
                  $
                  {proposedSettlement.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
              {hardCosts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Hard costs:{" "}
                  {hardCosts
                    .map((h) => `${h.description} $${h.amount}`)
                    .join(", ")}
                </p>
              )}
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-900/80">
                  Notices (PDF)
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/violations/${violation.id}/notices/first`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900 hover:bg-sky-100"
                  >
                    <span>First Notice</span>
                    <span className="ml-2 text-[10px] text-sky-700">PDF</span>
                  </a>
                  <a
                    href={`/api/violations/${violation.id}/notices/second`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900 hover:bg-sky-100"
                  >
                    <span>Second Notice</span>
                    <span className="ml-2 text-[10px] text-sky-700">PDF</span>
                  </a>
                  <a
                    href={`/api/violations/${violation.id}/notices/pc-209`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900 hover:bg-sky-100"
                  >
                    <span>PC 209 Notice</span>
                    <span className="ml-2 text-[10px] text-sky-700">PDF</span>
                  </a>
                  {!violation.is_accruing &&
                    violation.cure_photo_uploaded_at && (
                      <a
                        href={`/api/violations/${violation.id}/notices/cure-confirmation`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-900 hover:bg-emerald-100"
                      >
                        <span>Cure Confirmation</span>
                        <span className="ml-2 text-[10px] text-emerald-700">
                          PDF
                        </span>
                      </a>
                    )}
                </div>
              </div>
              {violation.is_accruing && (
                <CurePhotoButton violationId={violation.id} />
              )}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
