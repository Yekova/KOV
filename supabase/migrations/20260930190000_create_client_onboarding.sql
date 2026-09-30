-- La première connexion d'un client, et ce qu'il en reste.
--
-- ── POURQUOI UNE SEULE TABLE, ET NON CINQ ────────────────────────────
--
-- Le cahier des charges demandait client_profiles, client_access,
-- client_project_access, client_invitations et client_onboarding. Quatre
-- d'entre elles décriraient ce qui est déjà écrit ailleurs, et un fait
-- écrit à deux endroits finit par être écrit différemment.
--
-- 1. client_access — auth.users tient DÉJÀ tout ce qu'elle porterait :
--    invited_at (invitation envoyée), email_confirmed_at (compte activé),
--    last_sign_in_at (dernière connexion), banned_until (suspendu).
--    Vérifié sur les quatre comptes de ce projet, valeurs à l'appui. Le
--    statut se DÉDUIT donc (src/lib/clients/access.ts) au lieu d'être
--    recopié — et personne n'a à penser à le tenir à jour.
--
-- 2. client_invitations — le jeton est celui de Supabase, produit par
--    generateLink() et jamais conservé côté application. En stocker un
--    second, même haché, ajouterait un secret à protéger pour redire ce
--    que auth.users sait déjà. La date d'ouverture, elle, est dans
--    email_logs.opened_at, où l'envoi est journalisé depuis toujours.
--
-- 3. client_profiles — profiles porte déjà nom, société, téléphone,
--    fonction et adresse de facturation complète (22 colonnes).
--    profile_verified_at manquait : il rejoint la table ci-dessous, parce
--    que c'est un fait d'ONBOARDING (« le client a confirmé ») et non une
--    donnée d'identité.
--
-- 4. client_project_access — projects.client_id est une relation un-à-
--    plusieurs : un projet appartient à un client, et c'est cette colonne
--    qui décide de ce qu'il voit. Une table d'accès en créerait une
--    seconde, qui pourrait la contredire. Elle n'aurait de sens que le
--    jour où plusieurs contacts d'une même société ont des droits
--    différents sur un même projet — ce que rien ne demande aujourd'hui.
--
-- ── DES HORODATAGES, PAS DES BOOLÉENS ────────────────────────────────
--
-- Un booléen dit « fait ». Un horodatage dit « fait quand », ce qui est la
-- seule chose utile quand on cherche à comprendre pourquoi un client n'a
-- jamais fini. C'est aussi ce que le cahier des charges demande
-- explicitement pour profile_verified_at (§11).

begin;

create table client_onboarding (
  -- La clé primaire EST le client : un parcours par personne, et la
  -- contrainte d'unicité vient gratuitement avec.
  client_id uuid primary key references profiles (id) on delete cascade,

  welcome_seen_at timestamptz,
  profile_verified_at timestamptz,
  security_done_at timestamptz,
  project_seen_at timestamptz,
  validation_seen_at timestamptz,

  -- Renseigné quand les étapes obligatoires sont franchies. C'est ce que
  -- lit la redirection : tant qu'il est nul, un client qui arrive sur son
  -- espace est renvoyé vers son parcours.
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table client_onboarding enable row level security;

-- Chacun ne lit que le sien. Les écritures passent par une action serveur
-- qui vérifie l'identité : aucune politique d'écriture, donc aucun chemin
-- direct depuis le navigateur.
create policy "Chacun lit son propre parcours"
  on client_onboarding for select to authenticated
  using (client_id = auth.uid());

grant select on client_onboarding to authenticated;

comment on table client_onboarding is
  'Le parcours de première connexion, étape par étape. Ne contient QUE ce qu''aucune autre table ne sait : auth.users porte l''état du compte (invited_at, email_confirmed_at, last_sign_in_at, banned_until) et profiles porte l''identité.';

comment on column client_onboarding.profile_verified_at is
  'Le moment où le client a confirmé ses informations. Sert à savoir si l''adresse de facturation d''une facture a été vue par son destinataire.';

-- ── LES CLIENTS QUI SONT DÉJÀ ENTRÉS ────────────────────────────────
--
-- Le parcours est fait pour une PREMIÈRE connexion. Y renvoyer quelqu'un
-- qui utilise son espace depuis des semaines serait lui demander de
-- confirmer ce qu'il a déjà confirmé, et de choisir un mot de passe qu'il
-- possède.
--
-- Leur parcours est donc marqué comme terminé, daté de leur dernière
-- connexion — la seule date vraie dont on dispose pour dire « cette
-- personne est entrée ». auth.users.last_sign_in_at est lisible en SQL
-- (le schéma `auth` n'est simplement pas exposé par PostgREST).
--
-- profile_verified_at reste NUL : personne n'a rien confirmé, et
-- l'inscrire serait affirmer une vérification qui n'a pas eu lieu.

insert into client_onboarding (client_id, welcome_seen_at, security_done_at, project_seen_at, completed_at)
select p.id, u.last_sign_in_at, u.last_sign_in_at, u.last_sign_in_at, u.last_sign_in_at
from profiles p
join auth.users u on u.id = p.id
where p.role = 'client'
  and u.last_sign_in_at is not null
on conflict (client_id) do nothing;

commit;
