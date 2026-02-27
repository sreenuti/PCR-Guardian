import { createClient } from "@/lib/supabase/server";
import { getAccruedFineTotal } from "@/lib/fines";
import type { Violation } from "@/types/database";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: violations } = await supabase
    .from("violations")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_accruing", true);

  const now = new Date();
  const total = (violations ?? []).reduce(
    (sum, v) => sum + getAccruedFineTotal(v as Violation, now),
    0
  );

  return NextResponse.json({ total, asOf: now.toISOString() });
}
