-- Optional: run after migrations to seed a test violation for the first user.
-- Replace USER_ID with the auth.users.id of your test user after signup.

-- Example (uncomment and set your user id):
/*
insert into public.violations (user_id, violation_date, description, is_accruing)
values (
  'USER_ID'::uuid,
  (current_date - interval '15 days')::date,
  'Sample violation for testing',
  true
);

insert into public.hard_costs (violation_id, description, amount)
select id, 'Certified Mail', 15.00
from public.violations
where user_id = 'USER_ID'::uuid
order by created_at desc
limit 1;
*/