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

create policy "Public can submit leads"
  on leads
  for insert
  to anon
  with check (true);
