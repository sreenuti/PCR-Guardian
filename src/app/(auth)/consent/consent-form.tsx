"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ConsentState = {
  consent_sms: boolean;
  consent_email: boolean;
  consent_voice_ai: boolean;
};

export function ConsentForm({
  initialConsent,
}: {
  initialConsent: ConsentState;
}) {
  const [consent, setConsent] = useState(initialConsent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const allChecked =
      consent.consent_sms && consent.consent_email && consent.consent_voice_ai;
    if (!allChecked) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("You need to be signed in before continuing to the dashboard.");
      return;
    }
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        consent_sms: true,
        consent_email: true,
        consent_voice_ai: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );
    setLoading(false);
    if (error) {
      console.error("Failed to save consent:", error);
      setError(
        "We couldn't save your consent preferences. Please try again or contact support."
      );
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  const allChecked =
    consent.consent_sms && consent.consent_email && consent.consent_voice_ai;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Multi-Channel Consent</CardTitle>
        <CardDescription>
          You must opt in to all channels before viewing your dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent_sms"
              checked={consent.consent_sms}
              onCheckedChange={(c) =>
                setConsent((p) => ({ ...p, consent_sms: !!c }))
              }
            />
            <Label htmlFor="consent_sms" className="cursor-pointer">
              SMS notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent_email"
              checked={consent.consent_email}
              onCheckedChange={(c) =>
                setConsent((p) => ({ ...p, consent_email: !!c }))
              }
            />
            <Label htmlFor="consent_email" className="cursor-pointer">
              Email notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent_voice_ai"
              checked={consent.consent_voice_ai}
              onCheckedChange={(c) =>
                setConsent((p) => ({ ...p, consent_voice_ai: !!c }))
              }
            />
            <Label htmlFor="consent_voice_ai" className="cursor-pointer">
              Voice AI communications
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!allChecked || loading}
          >
            {loading ? "Saving…" : "Continue to dashboard"}
          </Button>
          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
