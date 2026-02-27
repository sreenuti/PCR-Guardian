"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function redirectAfterAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.refresh();
      router.push("/dashboard");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("consent_sms, consent_email, consent_voice_ai")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Failed to load consent profile:", error);
      router.refresh();
      router.push("/consent");
      return;
    }

    const anyConsent =
      profile?.consent_sms ||
      profile?.consent_email ||
      profile?.consent_voice_ai;

    router.refresh();
    router.push(anyConsent ? "/dashboard" : "/consent");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    await redirectAfterAuth();
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    await redirectAfterAuth();
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            PCR Transparency Portal — sign in or create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleSignUp}
            >
              Create account
            </Button>
            <Link href="/" className="text-sm text-muted-foreground mt-2">
              Back to home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
