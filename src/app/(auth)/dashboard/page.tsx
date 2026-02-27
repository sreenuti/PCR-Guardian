import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAccruedFineTotal,
  getProposedSettlement,
} from "@/lib/fines";
import type { Violation, HardCost } from "@/types/database";
import { LiveFineMeter } from "./live-fine-meter";
import { ViolationList } from "./violation-list";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("consent_sms, consent_email, consent_voice_ai")
    .eq("id", user.id)
    .single();

  const anyConsent =
    profile?.consent_sms ||
    profile?.consent_email ||
    profile?.consent_voice_ai;
  if (!anyConsent) redirect("/consent");

  const { data: violations } = await supabase
    .from("violations")
    .select("*")
    .eq("user_id", user.id)
    .order("violation_date", { ascending: false });

  const violationIds = (violations ?? []).map((v) => v.id);
  const { data: hardCostsRows } =
    violationIds.length > 0
      ? await supabase
          .from("hard_costs")
          .select("*")
          .in("violation_id", violationIds)
      : { data: [] as HardCost[] };

  const hardCostsByViolation = (hardCostsRows ?? []).reduce(
    (acc, h) => {
      const id = h.violation_id;
      if (!acc[id]) acc[id] = [];
      acc[id].push(h);
      return acc;
    },
    {} as Record<string, HardCost[]>
  );

  const now = new Date();
  const violationsWithTotals = (violations ?? []).map((v) => {
    const violation = v as Violation;
    const hardCosts = hardCostsByViolation[violation.id] ?? [];
    const accruedTotal = getAccruedFineTotal(violation, now);
    const proposedSettlement = getProposedSettlement(
      violation,
      hardCosts,
      now
    );
    return {
      violation,
      hardCosts,
      accruedTotal,
      proposedSettlement,
    };
  });

  const totalLiveFines = violationsWithTotals
    .filter(({ violation }) => violation.is_accruing)
    .reduce((sum, { accruedTotal }) => sum + accruedTotal, 0);

  return (
    <main className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between rounded-xl bg-primary/90 px-6 py-4 text-primary-foreground shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            PCR Transparency Portal
          </h1>
          <p className="text-xs font-medium text-primary-foreground/80">
            Dashboard to analyze HOA notice and fine data
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,4fr)]">
        <div className="space-y-4">
          <LiveFineMeter initialTotal={totalLiveFines} />

          <section className="rounded-xl border border-primary/30 bg-white/90 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
              Notice letters
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Each violation card on the right includes links to view the official
              First Notice, Second Notice, PC 209, and (once cured) Cure
              Confirmation PDFs based on your current notice level.
            </p>
          </section>
        </div>

        <div>
          <ViolationList
            violationsWithTotals={violationsWithTotals}
            hasAnyAccruing={violationsWithTotals.some(
              ({ violation }) => violation.is_accruing
            )}
          />
        </div>
      </section>
    </main>
  );
}
