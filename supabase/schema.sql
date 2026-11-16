-- =====================================================================
-- Framehaus — purchases & license keys (Supabase / PostgreSQL)
--
-- Run once in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- The script is idempotent: it can be executed again safely.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- License key generator: FH-XXXX-XXXX-XXXX
-- Alphabet without ambiguous characters (no I, O, 0, 1).
-- Uses cryptographically secure gen_random_bytes() from pgcrypto and
-- retries on the (astronomically unlikely) collision with an existing key.
-- ---------------------------------------------------------------------
create or replace function public.generate_license_key()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  alphabet_len constant int := length(alphabet); -- 32 → 256 is divisible by 32, so modulo has no bias
  bytes bytea;
  body text;
  candidate text;
  i int;
begin
  loop
    bytes := extensions.gen_random_bytes(12);
    body := '';
    for i in 0..11 loop
      body := body || substr(alphabet, (get_byte(bytes, i) % alphabet_len) + 1, 1);
    end loop;

    candidate := 'FH-' || substr(body, 1, 4) || '-' || substr(body, 5, 4) || '-' || substr(body, 9, 4);

    -- The table may not exist yet while this function is first created.
    if to_regclass('public.purchases') is null then
      return candidate;
    end if;

    if not exists (select 1 from public.purchases p where p.license_key = candidate) then
      return candidate;
    end if;
  end loop;
end;
$$;

revoke all on function public.generate_license_key() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------------
create table if not exists public.purchases (
  id               uuid        primary key default gen_random_uuid(),
  email            text        not null,
  product_slug     text        not null,
  whop_plan_id     text        not null,
  whop_receipt_id  text        not null unique,
  license_key      text        not null unique default public.generate_license_key(),
  r2_object_key    text        not null,
  created_at       timestamptz not null default now()
);

create index if not exists purchases_email_lower_idx on public.purchases (lower(email));
create index if not exists purchases_created_at_idx on public.purchases (created_at desc);

-- ---------------------------------------------------------------------
-- The license key is immutable once issued. Upserts from the webhook and
-- from /api/claim-download use ON CONFLICT (whop_receipt_id) DO NOTHING;
-- this trigger additionally guarantees that no UPDATE can ever replace it.
-- ---------------------------------------------------------------------
create or replace function public.purchases_keep_license_key()
returns trigger
language plpgsql
as $$
begin
  new.license_key := old.license_key;
  new.whop_receipt_id := old.whop_receipt_id;
  return new;
end;
$$;

drop trigger if exists purchases_keep_license_key on public.purchases;
create trigger purchases_keep_license_key
  before update on public.purchases
  for each row
  execute function public.purchases_keep_license_key();

-- ---------------------------------------------------------------------
-- Row Level Security
--   SELECT — a signed-in user sees only purchases made with their e-mail.
--   INSERT / UPDATE / DELETE — no policies, so only the service role
--   (SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS) can write.
-- ---------------------------------------------------------------------
alter table public.purchases enable row level security;

revoke insert, update, delete on public.purchases from anon, authenticated;
grant select on public.purchases to authenticated;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------
-- Reviews (one per buyer and product)
--   Written only by /api/reviews (service role) after checking that the
--   buyer owns the product; read publicly through /api/reviews, which
--   never returns e-mails. No RLS policies → anon/authenticated have no
--   direct access to this table.
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid        primary key default gen_random_uuid(),
  product_slug  text        not null,
  email         text        not null,
  author_name   text        not null,
  rating        smallint    not null check (rating between 1 and 5),
  comment       text        not null default '' check (char_length(comment) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint reviews_email_product_key unique (email, product_slug)
);

create index if not exists reviews_product_slug_idx on public.reviews (product_slug, updated_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
