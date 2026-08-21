alter table leads
  add column contact_method text check (contact_method in ('phone', 'video', 'in_person'));

comment on column leads.contact_method is
  'How the prospect wants to be recontacted, captured by the multi-step /contact wizard (phone/video/in_person). Nullable — older leads and any future non-wizard entry points may not set it.';
