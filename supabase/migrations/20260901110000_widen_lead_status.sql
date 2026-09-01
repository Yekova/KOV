-- Widens the lead pipeline from a flat new/contacted/won/lost into a real
-- sales pipeline (new -> contacted -> qualified -> proposal -> negotiation
-- -> won, with lost as a terminal exit from any stage) so the leads page
-- can show a genuine funnel instead of a 4-bucket status list.
--
-- NOTE: verify this constraint name against the live schema before running
-- (see the same note on project_tasks_status_check's own migration) —
-- Postgres names an inline column check "<table>_<column>_check" by
-- default with no explicit name given, which is what the original
-- 20260818120000_create_leads.sql migration relied on.
alter table leads drop constraint leads_status_check;
alter table leads add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'));

comment on column leads.status is
  'Sales pipeline stage. qualified/proposal/negotiation are new (this migration) — existing leads only ever had new/contacted/won/lost, all still valid values. won is the terminal "converted" state (see convertLeadToClient); lost is a terminal exit reachable from any stage, not part of the funnel''s linear order.';
