import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResidentOnboardingForm } from "@/components/ResidentOnboardingForm";

export default async function ConsentPage() {
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
  if (anyConsent) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ResidentOnboardingForm
        initialConsent={{
          consent_sms: profile?.consent_sms ?? false,
          consent_email: profile?.consent_email ?? false,
          consent_voice_ai: profile?.consent_voice_ai ?? false,
        }}
      />
    </main>
  );
}
