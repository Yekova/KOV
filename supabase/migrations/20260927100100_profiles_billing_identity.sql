-- L'identité de facturation du client.
--
-- `profiles` porte le nom, la société, l'email et le téléphone. Il n'a ni
-- adresse, ni SIREN, ni numéro de TVA — et `leads`, malgré ses trente
-- colonnes, n'en a pas davantage. Le PDF de devis n'imprime donc
-- aujourd'hui que le nom et l'email du destinataire.
--
-- Deux choses en découlent, et la seconde a une échéance :
--
-- 1. Un devis doit porter l'identité et l'adresse du destinataire. C'est
--    la base de ce qu'on attend d'un devis professionnel, et la spec du
--    module de pricing l'exige explicitement.
--
-- 2. La facturation électronique est obligatoire en réception pour toutes
--    les entreprises depuis le 1er septembre 2026, et le sera en émission
--    pour les PME et micro-entreprises au 1er septembre 2027. Un flux de
--    facturation électronique transporte le SIREN et l'adresse du client.
--    Ces colonnes ne sont pas un confort d'affichage : sans elles, le
--    passage devis vers facture n'aura pas de quoi se faire.
--
-- Tout est nullable : les clients existants n'ont pas ces informations et
-- rien ne doit casser tant qu'on ne les a pas demandées. L'écran signale
-- ce qui manque, il ne le devine pas.

alter table profiles
  add column if not exists address_street text,
  add column if not exists address_postal_code text,
  add column if not exists address_city text,
  add column if not exists address_country text,
  add column if not exists siren text,
  add column if not exists vat_number text;

comment on column profiles.siren is
  'SIREN du client (9 chiffres). Distinct du SIRET, qui porte en plus l''établissement : c''est le SIREN que transporte la facturation électronique. Saisi, jamais déduit.';
comment on column profiles.vat_number is
  'Numéro de TVA intracommunautaire, quand le client en a un. Null pour un particulier ou une structure non assujettie.';
comment on column profiles.address_country is
  'Pays. Null se lit « France » à l''affichage, mais n''est pas écrit en base : une valeur par défaut serait une supposition sur un client qu''on n''a pas interrogé.';

-- Le client tient à jour sa propre adresse de facturation, comme il tient
-- déjà son nom, sa société et son téléphone.
--
-- Rappel de 20260925100000, parce que c'est contre-intuitif et que c'est
-- exactement ici qu'on se trompe : un `grant update (colonnes)` est ADDITIF,
-- il n'est pas restrictif. Il n'a d'effet que parce que la migration
-- précédente a d'abord révoqué l'UPDATE global que Supabase accorde par
-- défaut. La policy RLS `auth.uid() = id` contraint la LIGNE ; ce sont ces
-- grants, et eux seuls, qui contraignent les COLONNES.
--
-- `role` et `account_manager_id` restent hors de cette liste, comme avant.
grant update (
  full_name, company, phone, updated_at,
  address_street, address_postal_code, address_city, address_country,
  siren, vat_number
) on table profiles to authenticated;

grant select (
  address_street, address_postal_code, address_city, address_country,
  siren, vat_number
) on table profiles to authenticated;
