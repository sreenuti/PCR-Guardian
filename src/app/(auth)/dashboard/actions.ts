"use server";

import { createClient } from "@/lib/supabase/server";
import { applyCurePhotoUpload } from "@/lib/fines";
import type { Violation } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function recordCurePhotoUpload(violationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: violation, error: fetchErr } = await supabase
    .from("violations")
    .select("*")
    .eq("id", violationId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !violation) {
    return { error: "Violation not found" };
  }

  if (!(violation as Violation).is_accruing) {
    return { error: "Already stopped" };
  }

  const at = new Date();
  const { fine_balance, is_accruing } = applyCurePhotoUpload(
    violation as Violation,
    at
  );

  const { error: updateErr } = await supabase
    .from("violations")
    .update({
      fine_balance,
      is_accruing,
      cure_photo_uploaded_at: at.toISOString(),
      updated_at: at.toISOString(),
    })
    .eq("id", violationId)
    .eq("user_id", user.id);

  if (updateErr) return { error: updateErr.message };
  revalidatePath("/dashboard");
  return {};
}
