-- Trois choses sur profiles : une colonne, un index, et une élévation de
-- privilège à fermer.

-- ── 1. Le téléphone du client ────────────────────────────────────────────
--
-- Il n'existait nulle part. Le formulaire de contact le capture dans
-- leads.phone, et la conversion en client le perdait définitivement : la
-- fiche client n'avait aucun endroit où le mettre.
--
-- Distinct de leads.phone, qui reste l'enregistrement daté de ce qui a été
-- saisi sur le formulaire. Celui-ci est le numéro vivant, modifiable.

alter table profiles add column if not exists phone text;

comment on column profiles.phone is
  'Numéro de contact vivant du client. Initialisé depuis leads.phone à la conversion, modifiable ensuite.';


-- ── 2. Le lien inverse lead → client ─────────────────────────────────────
--
-- leads.converted_profile_id existe depuis 20260823100000 et permet de
-- remonter du client au lead qui l'a produit — son brief, son budget, ses
-- notes, sa trace de consentement. Rien ne l'interrogeait, donc rien ne
-- l'indexait. C'est ce qui rend inutile une colonne miroir sur profiles :
-- deux colonnes pour un même fait finissent par se contredire.

create index if not exists leads_converted_profile_id_idx
  on leads (converted_profile_id)
  where converted_profile_id is not null;


-- ── 3. ÉLÉVATION DE PRIVILÈGE ────────────────────────────────────────────
--
-- Constaté le 2026-09-25, confirmé par has_column_privilege() :
--
--   has_column_privilege('authenticated','profiles','role','UPDATE') → true
--
-- Autrement dit, n'importe quel client connecté pouvait exécuter, depuis
-- son navigateur avec la clé publique :
--
--   update profiles set role = 'admin' where id = auth.uid();
--
-- et devenir administrateur du CRM. La policy RLS « Users can update own
-- profile » contraint la LIGNE (auth.uid() = id) mais pas les COLONNES :
-- mettre à jour sa propre ligne la satisfait, quelle que soit la colonne
-- touchée.
--
-- Pourquoi ça a échappé : la migration 20260819090000 écrit
--   grant update (full_name, company, updated_at) on profiles to authenticated;
-- avec un commentaire expliquant que role et id en sont délibérément
-- exclus. Ce raisonnement serait juste sur une table sans autre droit —
-- mais Supabase accorde par défaut tous les droits sur le schéma public à
-- anon et authenticated, en comptant sur RLS pour les contenir. Le grant
-- par colonnes s'est donc ajouté à un grant par table déjà plus large, au
-- lieu de le restreindre. Il n'a jamais rien protégé.
--
-- Portée exacte, vérifiée : profiles est la SEULE table dont une policy
-- autorise l'écriture par un utilisateur connecté. Les autres n'ont qu'une
-- policy de lecture, ou aucune — leurs droits larges ne mènent donc nulle
-- part. La seule autre policy d'écriture est l'insertion publique sur
-- leads, qui est le formulaire de contact et qui est voulue.
--
-- Correction volontairement chirurgicale : on retire les verbes d'écriture
-- et on rend le seul qui serve, colonne par colonne. SELECT n'est pas
-- touché — il est déjà contenu par RLS à la ligne de l'utilisateur, et le
-- retirer risquerait de casser une lecture qu'on n'aurait pas trouvée.

revoke insert, update, delete, truncate on table profiles from anon;
revoke insert, update, delete, truncate on table profiles from authenticated;

-- Ce que la migration d'origine voulait dire, et qui prend effet seulement
-- maintenant. `phone` y figure : c'est le numéro du client, il doit pouvoir
-- le corriger depuis son espace.
grant update (full_name, company, phone, updated_at) on table profiles to authenticated;
