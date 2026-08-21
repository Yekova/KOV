-- Links a lead to the client profile created when an admin converts it
-- (see /admin/leads/[id] "Convertir en client"). Null until converted.
alter table leads add column converted_profile_id uuid references profiles (id) on delete set null;

comment on column leads.converted_profile_id is
  'Set when an admin converts this lead into a client account — see convertLeadToClient.';
