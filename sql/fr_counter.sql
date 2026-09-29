-- Counter for the FR-001, FR-002, ... Unique Numbers given to rows submitted
-- from Account Checking. Run once in the Supabase SQL Editor of the main
-- (freight) project. Existing KIT-... numbers and increment_kit_counter are
-- left untouched.

create table if not exists public.fr_counter (
  id integer primary key default 1,
  value bigint not null default 0,
  constraint fr_counter_single_row check (id = 1)
);

insert into public.fr_counter (id, value)
values (1, 0)
on conflict (id) do nothing;

-- No direct table access from the app; only through the function below.
alter table public.fr_counter enable row level security;

-- Atomic: concurrent submits can never get the same number.
create or replace function public.increment_fr_counter()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.fr_counter
     set value = value + 1
   where id = 1
  returning value;
$$;

grant execute on function public.increment_fr_counter() to anon, authenticated;
