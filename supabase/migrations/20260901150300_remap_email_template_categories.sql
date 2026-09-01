-- The 7 templates seeded before this pass used `category` as a granular
-- per-template identity (premier_contact, relance, apres_rdv, ...). This
-- pass's spec wants `category` to be the broad grouping shown in the
-- composer's template picker (Contact/Relance/Commercial/Rendez-vous/
-- Projet/Fidélisation/Personnalisé) — the specific identity already lives
-- in `name` ("01 — Premier contact"), so this just remaps the category
-- values, no data loss.
update email_templates set category = 'contact' where category = 'premier_contact';
update email_templates set category = 'relance' where category in ('relance', 'derniere_relance');
update email_templates set category = 'commercial' where category in ('proposition', 'relance_proposition');
update email_templates set category = 'rendez_vous' where category in ('apres_rdv', 'prise_rdv');
