import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-xl">
        <h1 className="text-2xl font-bold">PCR Transparency Portal</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view your violations, live fine meter, and communication
          preferences.
        </p>
        <Link
          href="/login"
          className="text-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
