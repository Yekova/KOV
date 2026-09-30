-- Le tableau de bord, arrangé par celui qui le regarde.
--
-- ── CE QUI EST STOCKÉ, ET CE QUI NE L'EST PAS ────────────────────────
--
-- Cette table ne contient PAS la liste des blocs : celle-ci vit dans le
-- code (src/lib/dashboard/blocks.ts), avec pour chacun son libellé et sa
-- taille par défaut. Elle ne retient que ce qu'aucun défaut ne donne :
-- l'ordre choisi, la largeur choisie, et ce qui a été masqué.
--
-- La conséquence compte : ajouter un bloc au tableau de bord ne demande
-- aucune migration et ne casse aucun arrangement enregistré. Le bloc
-- inconnu de l'arrangement apparaît simplement à la fin, à sa taille par
-- défaut. Inversement, un bloc retiré du code disparaît des arrangements
-- sans qu'on ait à les nettoyer.
--
-- ── POURQUOI UNE TABLE, ET PAS UNE COLONNE SUR profiles ──────────────
--
-- Un même compte peut regarder deux surfaces — le studio a un tableau de
-- bord, le portail en a un autre. Une colonne devrait alors contenir les
-- deux, c'est-à-dire deux sujets dans une seule valeur. La clé
-- (utilisateur, surface) dit exactement ce qui est arrangé.

-- Appliquée en production le 30 septembre 2026, et vérifiée : 5 colonnes,
-- RLS active avec 1 politique, 4 contraintes (clé primaire, contrainte de
-- surface, clé étrangère, unicité (utilisateur, surface)), 0 ligne.

begin;

create table dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  surface text not null check (surface in ('admin', 'client')),

  -- Un tableau d'objets { id, span, hidden }. Volontairement non
  -- contraint en base : sa forme est validée à la lecture comme à
  -- l'écriture (src/lib/dashboard/layout.ts), parce qu'une entrée dont le
  -- bloc n'existe plus doit être ignorée en silence, pas refusée — sinon
  -- un déploiement qui retire un bloc casserait l'écran de tous ceux qui
  -- l'avaient déplacé.
  blocks jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now(),

  unique (user_id, surface)
);

create index dashboard_preferences_user_idx on dashboard_preferences (user_id);

alter table dashboard_preferences enable row level security;

-- Chacun ne lit que son propre arrangement. Les écritures passent par une
-- action serveur qui vérifie l'identité — aucune politique d'écriture,
-- donc aucun chemin direct depuis le navigateur.
create policy "Chacun lit son propre arrangement"
  on dashboard_preferences for select to authenticated
  using (user_id = auth.uid());

grant select on dashboard_preferences to authenticated;

comment on table dashboard_preferences is
  'Arrangement du tableau de bord par utilisateur et par surface. Ne contient que les écarts au défaut : ordre, largeur, masquage. La liste des blocs est dans le code.';

commit;
