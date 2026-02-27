# PCR Transparency Portal (PoC)

HOA compliance PoC: fine accrual ($50/day from day 11), stop-clock on cure photo, 90/10 settlement, multi-channel consent gate, and live fine meter.

## Stack

- **Next.js 15** (App Router), TypeScript, Tailwind CSS
- **Supabase**: Postgres + Auth
- **Shadcn-style UI** (Button, Card, Checkbox, Label, Badge, Progress, Skeleton, Input)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run the migration: `supabase/migrations/00001_initial_schema.sql`.
   - Copy project URL and anon key from Settings → API.

3. **Environment**

   Copy `.env.local.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, complete consent (SMS, Email, Voice AI), then view the dashboard. Use the Supabase SQL Editor or `seed.sql` (after replacing `USER_ID`) to add a test violation and hard cost.

## Business rules

- **Fine accrual:** $50/day; meter starts 10 days after `violation_date`.
- **Stop-clock:** Recording a cure photo sets `is_accruing` to false and locks `fine_balance` at that time.
- **90/10 settlement:** Proposed settlement = 10% of accrued fines + 100% of hard costs (e.g. $15 certified mail).
- **Consent:** Users must opt in to SMS, Email, and Voice AI before accessing the dashboard.
- **Live Fine Meter:** Red, incrementing total of accruing violations (polled every second from `/api/live-balance`).

## Routes

- `/` — Home (link to sign in)
- `/login` — Sign in / Create account
- `/consent` — Multi-channel consent (required before dashboard)
- `/dashboard` — Violations, live fine meter, proposed settlement, “Record cure photo uploaded”
