create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  source text,
  notes text
);

alter table leads enable row level security;

-- NOTE: this project's `anon` role does not satisfy `to anon`-scoped policies for
-- INSERT (confirmed with fresh probe tables + a full project restart — looks like a
-- platform-level quirk, not a config mistake). `to public` works. Either way, the
-- real contact-form path (src/app/api/contact/route.ts) writes via the service-role
-- client server-side and bypasses RLS entirely — this policy is defense-in-depth for
-- any future direct anon-key usage, not what the form currently depends on.
create policy "Public can submit leads"
  on leads
  for insert
  to public
  with check (true);

grant insert on leads to anon, authenticated, public;
