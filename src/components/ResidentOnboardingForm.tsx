"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const onboardingSchema = z
  .object({
    consentSms: z.boolean(),
    consentEmail: z.boolean(),
    consentVoiceAi: z.boolean(),
    acceptDisclaimer: z.literal(true, {
      message: "You must accept the disclaimer to continue.",
    }),
  })
  .refine(
    (data) => data.consentSms || data.consentEmail || data.consentVoiceAi,
    {
      message: "Select at least one communication channel (SMS, Email, or Voice AI).",
      path: ["consentSms"],
    }
  );

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const defaultValues: OnboardingFormValues = {
  consentSms: false,
  consentEmail: false,
  consentVoiceAi: false,
  acceptDisclaimer: false as unknown as true,
};

type ResidentOnboardingFormProps = {
  initialConsent?: {
    consent_sms: boolean | null;
    consent_email: boolean | null;
    consent_voice_ai: boolean | null;
  };
};

export function ResidentOnboardingForm({
  initialConsent,
}: ResidentOnboardingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initialConsent
      ? {
          consentSms: !!initialConsent.consent_sms,
          consentEmail: !!initialConsent.consent_email,
          consentVoiceAi: !!initialConsent.consent_voice_ai,
          acceptDisclaimer: false as unknown as true,
        }
      : defaultValues,
  });

  const consentError = form.formState.errors.consentSms?.message;
  const disclaimerError = form.formState.errors.acceptDisclaimer?.message;

  async function onSubmit(data: OnboardingFormValues) {
    setSubmitError(null);
    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSubmitting(false);
      setSubmitError(
        "You need to be signed in before continuing to the dashboard."
      );
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        consent_sms: data.consentSms,
        consent_email: data.consentEmail,
        consent_voice_ai: data.consentVoiceAi,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    setSubmitting(false);

    if (error) {
      console.error("Failed to save resident onboarding consent:", error);
      setSubmitError(
        "We couldn't save your consent preferences. Please try again or contact support."
      );
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto max-w-md space-y-8 rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
          Resident onboarding
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how you’d like to receive HOA notices and confirm the legal disclaimer below.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Communication consent</p>
          <div className="space-y-3">
            <Controller
              name="consentSms"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent-sms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="consent-sms"
                    className="cursor-pointer text-sm font-normal"
                  >
                    SMS
                  </Label>
                </div>
              )}
            />
            <Controller
              name="consentEmail"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent-email"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="consent-email"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Email
                  </Label>
                </div>
              )}
            />
            <Controller
              name="consentVoiceAi"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent-voice-ai"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="consent-voice-ai"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Voice AI
                  </Label>
                </div>
              )}
            />
          </div>
          {consentError && (
            <p className="text-sm text-destructive">{consentError}</p>
          )}
        </div>

        <div
          className={cn(
            "rounded-md border bg-muted/50 p-4",
            disclaimerError && "border-destructive/50"
          )}
        >
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Legal disclaimer:</strong> By
            opting in to any of the channels above, you agree that the
            Association may send you notices, including notices regarding{" "}
            <strong className="text-foreground">daily fines and violations</strong>,
            via SMS, email, and/or Voice AI, as selected. Message and data rates
            may apply. You may update your preferences at any time.
          </p>
          <Controller
            name="acceptDisclaimer"
            control={form.control}
            render={({ field }) => (
              <div className="mt-4 flex items-start space-x-2">
                <Checkbox
                  id="accept-disclaimer"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <Label
                  htmlFor="accept-disclaimer"
                  className="cursor-pointer text-sm font-normal leading-tight"
                >
                  I have read and accept this disclaimer. I understand that daily
                  fines will be communicated via the channels I selected above.
                </Label>
              </div>
            )}
          />
          {disclaimerError && (
            <p className="mt-2 text-sm text-destructive">{disclaimerError}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Submit"}
      </Button>
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
    </form>
  );
}
