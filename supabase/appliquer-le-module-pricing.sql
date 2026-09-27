-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  MODULE DE PRICING — À COLLER DANS L'ÉDITEUR SQL DE SUPABASE         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Ce fichier n'est PAS une migration. Il vit en dehors de
-- supabase/migrations/ pour que « supabase db push » ne le rejoue pas : il
-- ne contient que la concaténation, dans l'ordre, des trois migrations du
-- module de pricing.
--
--   • Avec la CLI Supabase : ignorez ce fichier, lancez « supabase db push ».
--   • Avec l'éditeur SQL du dashboard : collez tout, exécutez une fois.
--
-- Le tout est enveloppé dans une transaction : si une seule instruction
-- échoue, RIEN n'est appliqué et la base reste exactement dans l'état où
-- elle était. Il n'y a donc pas d'état intermédiaire à réparer.
--
-- Ces trois migrations ont déjà été jouées une fois contre cette base à
-- l'intérieur d'une transaction annulée, le 27 septembre 2026 : elles
-- passent, et les totaux relus depuis les tables correspondaient au
-- calibrage attendu. Le rollback n'a laissé aucune trace.
--
-- La dernière instruction affiche un récapitulatif de ce qui a été créé.
-- Attendu : 12 tables, 10 rôles, 7 offres, 61 modules, 2 versions
-- tarifaires, 22 références de marché, 6 nouvelles colonnes sur profiles.

begin;

-- ─────────────────────────────────────────────────────────────────────
-- Le schéma — douze tables pricing_, RLS activée sans policy
-- source : supabase/migrations/20260927100000_create_pricing_module.sql
-- ─────────────────────────────────────────────────────────────────────

-- Module de pricing KOV — structure.
--
-- Voir docs/specs/pricing.md (la demande) et docs/specs/pricing-phase-0.md
-- (l'exploration et les décisions). Le catalogue et les références de
-- marché sont chargés par la migration de seed qui suit.
--
-- ── TROIS DÉCISIONS QUI EXPLIQUENT TOUT LE RESTE ─────────────────────────
--
-- 1. Les montants sont en centimes entiers (bigint) et les taux en points
--    de base (1 % = 100 bp). Aucun flottant n'entre en base : un prix qui
--    doit être justifié ligne par ligne ne peut pas dépendre de la façon
--    dont une machine arrondit 0,1 + 0,2.
--
-- 2. Le catalogue porte des valeurs de BASE 2027, et l'indexation de la
--    version tarifaire les déplace toutes ensemble — taux de vente, prix de
--    référence, bandes de marché, abonnements. C'est la seule façon d'éviter
--    que l'alerte « la composition par défaut s'écarte de la grille » se
--    déclenche sur toutes les offres le 1er janvier 2028, simplement parce
--    que les taux auraient bougé et pas les références. Un coefficient, pas
--    deux jeux de chiffres à tenir d'accord.
--
-- 3. Le prix d'une configuration n'est jamais relu depuis le catalogue :
--    il est figé dans `snapshot`. Changer un taux demain ne réécrit pas
--    l'histoire des devis d'hier. C'est ce qui permet d'expliquer un prix
--    un an plus tard, ce que la spec pose comme non négociable.
--
-- Aucune table existante n'est modifiée. Le lien avec le module de devis
-- se fait dans un seul sens, pricing_configurations.quote_id — deux
-- pointeurs qui peuvent se contredire valent moins qu'un seul.
--
-- RLS activée partout, zéro policy : outil interne, toute lecture passe par
-- supabaseAdmin. C'est la convention du dépôt depuis `quotes` et
-- `business_settings`.


-- ── La version tarifaire ─────────────────────────────────────────────────
--
-- Une ligne = un jeu complet de paramètres à une date. Volontairement large :
-- une version EST un instantané de tous les paramètres pris ensemble, et les
-- éclater en tables séparées permettrait de n'en versionner que la moitié.

create table pricing_settings_versions (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  label text not null,
  effective_from date not null,

  -- Coût de revient : calculé, jamais saisi (spec §4.2).
  regime text not null check (regime in ('micro', 'is')),
  target_net_income_cents bigint not null check (target_net_income_cents >= 0),
  contribution_rate_bp integer not null check (contribution_rate_bp between 0 and 9999),
  fixed_costs_cents bigint not null check (fixed_costs_cents >= 0),
  depreciation_cents bigint not null check (depreciation_cents >= 0),
  billable_days numeric(6,2) not null check (billable_days > 0),
  -- Le taux TNS de 45 % est donné par la spec comme « un ordre de grandeur à
  -- confirmer avec l'expert-comptable ». Il pilote le coût de revient 2028,
  -- donc toutes les alertes bloquantes de cette année-là. Tant que ce drapeau
  -- est faux, l'écran des réglages le dit à l'écran au lieu de le présenter
  -- comme acquis.
  contribution_rate_confirmed boolean not null default false,

  -- Coefficients (spec §4.2 et §5.1).
  indexation_bp integer not null default 0,
  external_uplift_bp integer not null default 1000,
  complexity_simple_bp integer not null default 9000,
  complexity_standard_bp integer not null default 10000,
  complexity_high_bp integer not null default 12000,
  complexity_critical_bp integer not null default 14000,
  urgency_normal_bp integer not null default 0,
  urgency_reduced_25_bp integer not null default 1500,
  urgency_reduced_40_bp integer not null default 3000,
  small_project_bp integer not null default 1500,
  small_project_threshold_days numeric(6,2) not null default 8,
  rounding_step_cents bigint not null default 5000 check (rounding_step_cents > 0),

  -- Garde-fous (spec §4.3).
  max_discount_bp integer not null default 1000,
  floor_day_rate_cents bigint not null default 42000,
  target_margin_bp integer not null default 1500,
  max_subcontracted_share_bp integer not null default 4000,
  scoping_threshold_days numeric(6,2) not null default 15,
  benchmark_staleness_days integer not null default 180,
  grid_deviation_bp integer not null default 1000,

  -- Conditions par défaut.
  out_of_scope_day_rate_cents bigint not null default 45000,
  quote_validity_days integer not null default 30,

  -- TVA : paramètre daté (spec §4.2).
  vat_regime text not null default 'franchise' check (vat_regime in ('franchise', 'standard')),
  vat_rate_bp integer not null default 2000,
  vat_exemption_mention text,
  franchise_threshold_cents bigint not null default 3750000,
  franchise_increased_threshold_cents bigint not null default 4125000,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, effective_from)
);

comment on table pricing_settings_versions is
  'Un jeu complet de paramètres à une date. La version active d''une année tarifaire est celle dont effective_from est la plus récente parmi les versions de cette année. Une configuration garde la version avec laquelle elle a été créée.';
comment on column pricing_settings_versions.indexation_bp is
  'Indexation par rapport aux valeurs de base 2027 du catalogue. Appliquée UNIFORMÉMENT aux taux de vente, aux prix de référence, aux bandes de marché et aux abonnements — sinon l''alerte d''écart à la grille se déclencherait partout dès que les taux bougent seuls.';
comment on column pricing_settings_versions.contribution_rate_confirmed is
  'Faux tant que le taux de cotisations n''a pas été validé par un expert-comptable. L''écran des réglages affiche alors la réserve au lieu de présenter le coût de revient comme un fait.';


-- ── Les rôles ────────────────────────────────────────────────────────────

create table pricing_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  -- Valeurs de base 2027. La version tarifaire les indexe.
  sell_rate_cents bigint not null check (sell_rate_cents >= 0),
  freelance_cost_cents bigint check (freelance_cost_cents >= 0),
  internal_only boolean not null default false,
  default_subcontracted boolean not null default false,
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  -- Un rôle interne n'a pas de coût freelance, et un rôle sous-traité par
  -- défaut doit en avoir un : sans lui, cocher « sous-traité » calculerait
  -- une marge sur un coût inconnu.
  constraint pricing_roles_subcontracting_coherent check (
    (internal_only and freelance_cost_cents is null)
    or (not internal_only and (not default_subcontracted or freelance_cost_cents is not null))
  )
);

comment on column pricing_roles.freelance_cost_cents is
  'Coût d''un freelance pour ce rôle. Peut dépasser le taux de vente — c''est une réalité du modèle que l''outil rend visible par une alerte, pas un cas à corriger dans les données.';


-- ── Les offres ───────────────────────────────────────────────────────────

create table pricing_offers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  summary text,
  -- Valeurs de base 2027, indexées par la version tarifaire.
  reference_price_cents bigint check (reference_price_cents >= 0),
  external_costs_cents bigint not null default 0 check (external_costs_cents >= 0),
  lead_time_label text,
  contingency_bp integer not null default 0,
  payment_schedule jsonb not null default '[]',
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column pricing_offers.payment_schedule is
  'Échéancier par défaut : [{label, percent_bp, round_code}]. Modifiable par configuration. La somme des percent_bp doit valoir 10000, vérifié côté moteur.';
comment on column pricing_offers.reference_price_cents is
  'Prix de référence de la grille, en base 2027. Null pour « sur mesure », qui n''a pas de grille : l''alerte de calibrage ne s''y applique pas.';
comment on column pricing_offers.contingency_bp is
  'Marge d''aléa recommandée, affichée au chiffrage et jamais appliquée automatiquement. La spec la recommande à 10 % sur l''outil métier.';


-- ── Les modules ──────────────────────────────────────────────────────────

create table pricing_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  -- Round principal. Certains modules s'étalent (« R2-R3 » dans la spec) :
  -- round_span_label conserve le texte d'origine pour l'affichage, round_code
  -- porte le premier round cité, qui est celui où la ligne de devis se range.
  -- Transcription, pas arbitrage.
  round_code text not null check (round_code in ('R0','R1','R2','R3','R4','R5','R6','R7')),
  round_span_label text,
  quantity_unit text,
  default_quantity numeric(6,2) not null default 1 check (default_quantity > 0),
  external_costs_cents bigint not null default 0 check (external_costs_cents >= 0),
  is_optional boolean not null default false,
  depends_on text[] not null default '{}',
  conflicts_with text[] not null default '{}',
  -- Hypothèse poussée automatiquement dans le devis quand ce module est
  -- retenu. La spec l'exige pour les pages légales et tout contenu réglementé :
  -- la validation des mentions relève du client, et ça doit être écrit.
  quote_assumption text,
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column pricing_modules.quantity_unit is
  'Unité de la quantité (page, langue, écran, intégration, demi-journée). Null = module non quantifiable, quantité toujours 1.';
comment on column pricing_modules.archived_at is
  'Un module déjà retenu dans une configuration ne se supprime pas, il s''archive : le devis qui le cite doit rester lisible. Règle appliquée à tout le catalogue plutôt qu''aux seuls modules, pour n''avoir jamais à se demander laquelle des deux s''applique.';

create table pricing_module_role_days (
  module_id uuid not null references pricing_modules (id) on delete cascade,
  role_code text not null references pricing_roles (code) on update cascade,
  days numeric(6,2) not null check (days > 0),
  primary key (module_id, role_code)
);

create table pricing_offer_default_modules (
  offer_id uuid not null references pricing_offers (id) on delete cascade,
  module_id uuid not null references pricing_modules (id) on delete cascade,
  quantity numeric(6,2) not null default 1 check (quantity > 0),
  position integer not null default 0,
  primary key (offer_id, module_id)
);

comment on table pricing_offer_default_modules is
  'Composition par défaut d''une offre : ce qui est pré-coché quand on la choisit. « Sur mesure » n''a délibérément aucune ligne ici.';


-- ── Les abonnements ──────────────────────────────────────────────────────

create table pricing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  -- Valeurs de base 2027, indexées comme le reste.
  monthly_price_cents bigint not null check (monthly_price_cents >= 0),
  monthly_days numeric(6,2) not null default 0 check (monthly_days >= 0),
  monthly_external_cents bigint not null default 0 check (monthly_external_cents >= 0),
  monthly_role_code text references pricing_roles (code) on update cascade,
  min_commitment_months integer not null default 0 check (min_commitment_months >= 0),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table pricing_subscriptions is
  'Calculé séparément du projet (prix mensuel, valeur annuelle, marge mensuelle) : un abonnement n''est pas un jalon de production et ne doit pas entrer dans la marge projet.';


-- ── Le marché ────────────────────────────────────────────────────────────

create table pricing_market_bands (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references pricing_offers (id) on delete cascade,
  tier text not null check (tier in ('freelance', 'agence', 'premium')),
  -- Base 2027, indexées avec le reste.
  min_cents bigint check (min_cents >= 0),
  max_cents bigint check (max_cents >= 0),
  position integer not null default 0,
  unique (offer_id, tier),
  constraint pricing_market_bands_ordered check (min_cents is null or max_cents is null or min_cents <= max_cents)
);

comment on column pricing_market_bands.max_cents is
  'Null = bande ouverte vers le haut (« premium au-delà »). Une borne inventée serait plus fausse qu''une borne absente.';

create table pricing_market_benchmarks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value_cents bigint not null check (value_cents >= 0),
  value_max_cents bigint check (value_max_cents >= 0),
  unit text not null default 'day' check (unit in ('day', 'project', 'month')),
  seniority text,
  zone text,
  source text not null,
  source_url text,
  consulted_at date not null,
  -- La nature du chiffre, parce qu'une statistique de plateforme et trois
  -- profils consultés à la main ne se citent pas de la même façon.
  nature text not null check (nature in ('platform_statistic', 'individual_observation', 'commercial_page', 'secondary_source')),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table pricing_market_benchmarks is
  'Références de marché saisies à la main, avec leur source et leur date. Aucun scraping : la spec l''interdit, et une donnée dont on ne peut pas citer l''origine ne sert à rien pour justifier un prix.';


-- ── Les textes ───────────────────────────────────────────────────────────

create table pricing_text_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  kind text not null check (kind in ('included', 'excluded', 'assumption', 'intro', 'module_description')),
  body text not null,
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table pricing_text_templates is
  'Blocs de texte du devis. Français sobre, aucun superlatif, et aucun tiret cadratin ni demi-cadratin (spec §4.4) : les deux-points, la virgule et la parenthèse font le travail.';


-- ── La production ────────────────────────────────────────────────────────

create table pricing_configurations (
  id uuid primary key default gen_random_uuid(),
  settings_version_id uuid not null references pricing_settings_versions (id),
  offer_id uuid references pricing_offers (id),
  client_id uuid references profiles (id) on delete set null,
  lead_id uuid references leads (id) on delete set null,

  title text not null,
  segment text,
  client_vat_regime text not null default 'liable'
    check (client_vat_regime in ('liable', 'partial', 'exempt')),

  selection jsonb not null default '{}',
  conditions jsonb not null default '{}',
  snapshot jsonb,

  -- Trois statuts stockés, cinq affichés. « Envoyé » et « signé » se lisent
  -- sur le devis lié, qui en est propriétaire : les dupliquer ici créerait
  -- deux vérités qui finiraient par se contredire. Même raisonnement que la
  -- règle « les phases font foi » du portail client.
  status text not null default 'draft' check (status in ('draft', 'quoted', 'lost')),
  lost_reason text,

  quote_id uuid references quotes (id) on delete set null,
  version integer not null default 1 check (version >= 1),
  parent_id uuid references pricing_configurations (id) on delete set null,

  -- Dérogation à une alerte bloquante : motivée et journalisée, sinon la
  -- génération est refusée (spec §4.3).
  override_reason text,
  override_by uuid references profiles (id) on delete set null,
  override_at timestamptz,

  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pricing_configurations_override_complete check (
    (override_reason is null and override_at is null)
    or (override_reason is not null and override_at is not null)
  ),
  constraint pricing_configurations_lost_reason check (
    status <> 'lost' or lost_reason is not null
  )
);

comment on column pricing_configurations.snapshot is
  'Instantané complet du calcul : taux appliqués, coût de revient retenu, résultat ligne par ligne, alertes au moment de la génération. Sans lui, modifier un taux réécrirait le prix de tous les devis passés.';
comment on column pricing_configurations.selection is
  'Stocké en jsonb et non en table fille : une sélection se lit et s''écrit d''un bloc, jamais module par module, et elle doit pouvoir être rejouée telle quelle. Une table fille inviterait des jointures qui divergeraient du snapshot. La seule requête transversale utile (quelles configurations citent le module X, avant de l''archiver) se fait par conteneur jsonb, d''où l''index GIN ci-dessous.';

create index pricing_configurations_client_idx on pricing_configurations (client_id) where client_id is not null;
create index pricing_configurations_lead_idx on pricing_configurations (lead_id) where lead_id is not null;
create index pricing_configurations_created_idx on pricing_configurations (created_at desc);
create unique index pricing_configurations_quote_idx on pricing_configurations (quote_id) where quote_id is not null;
create index pricing_configurations_selection_idx on pricing_configurations using gin (selection jsonb_path_ops);


create table pricing_actuals (
  configuration_id uuid not null references pricing_configurations (id) on delete cascade,
  role_code text not null references pricing_roles (code) on update cascade,
  days numeric(6,2) not null default 0 check (days >= 0),
  updated_at timestamptz not null default now(),
  primary key (configuration_id, role_code)
);

comment on table pricing_actuals is
  'Jours réellement consommés, saisis après signature. L''écart vendu contre consommé est l''indicateur de pilotage du studio : le schéma doit le permettre dès la première version, même si l''écran reste simple.';


-- ── updated_at ───────────────────────────────────────────────────────────

create or replace function pricing_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger pricing_settings_versions_touch
  before update on pricing_settings_versions
  for each row execute function pricing_touch_updated_at();

create trigger pricing_configurations_touch
  before update on pricing_configurations
  for each row execute function pricing_touch_updated_at();

create trigger pricing_actuals_touch
  before update on pricing_actuals
  for each row execute function pricing_touch_updated_at();


-- ── RLS ──────────────────────────────────────────────────────────────────
--
-- Activée sans aucune policy : le pricing est un outil interne, il expose
-- les coûts de revient et les marges. Rien n'en sort côté client, et toute
-- lecture admin passe par la clé service.

alter table pricing_settings_versions enable row level security;
alter table pricing_roles enable row level security;
alter table pricing_offers enable row level security;
alter table pricing_modules enable row level security;
alter table pricing_module_role_days enable row level security;
alter table pricing_offer_default_modules enable row level security;
alter table pricing_subscriptions enable row level security;
alter table pricing_market_bands enable row level security;
alter table pricing_market_benchmarks enable row level security;
alter table pricing_text_templates enable row level security;
alter table pricing_configurations enable row level security;
alter table pricing_actuals enable row level security;

-- Ceinture et bretelles : la RLS sans policy suffit déjà, mais Supabase
-- accorde par défaut tous les privilèges sur `public` aux rôles anon et
-- authenticated. Révoquer explicitement rend l'intention lisible et couvre
-- le jour où quelqu'un ajouterait une policy sans y penser.
revoke all on table pricing_settings_versions from anon, authenticated;
revoke all on table pricing_roles from anon, authenticated;
revoke all on table pricing_offers from anon, authenticated;
revoke all on table pricing_modules from anon, authenticated;
revoke all on table pricing_module_role_days from anon, authenticated;
revoke all on table pricing_offer_default_modules from anon, authenticated;
revoke all on table pricing_subscriptions from anon, authenticated;
revoke all on table pricing_market_bands from anon, authenticated;
revoke all on table pricing_market_benchmarks from anon, authenticated;
revoke all on table pricing_text_templates from anon, authenticated;
revoke all on table pricing_configurations from anon, authenticated;
revoke all on table pricing_actuals from anon, authenticated;



-- ─────────────────────────────────────────────────────────────────────
-- L'identité de facturation du client — adresse, SIREN, TVA
-- source : supabase/migrations/20260927100100_profiles_billing_identity.sql
-- ─────────────────────────────────────────────────────────────────────

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



-- ─────────────────────────────────────────────────────────────────────
-- Le catalogue de départ — rôles, offres, 61 modules, références
-- source : supabase/migrations/20260927100200_seed_pricing_catalog.sql
-- ─────────────────────────────────────────────────────────────────────

-- Module de pricing KOV — catalogue de départ.
--
-- Toutes les valeurs viennent de docs/specs/pricing.md §5, transcrites sans
-- arbitrage. Les montants sont en base 2027 ; la version tarifaire les
-- indexe (voir le commentaire de pricing_settings_versions.indexation_bp).
--
-- Deux transcriptions méritent d'être signalées parce qu'elles ressemblent
-- à des décisions alors qu'elles n'en sont pas :
--
-- - La spec donne certains modules sur deux rounds (« R2-R3 », « R0-R6 »).
--   round_code porte le PREMIER round cité, round_span_label conserve le
--   texte d'origine. Choisir « le round où se trouve le gros du travail »
--   aurait été un jugement ; prendre le premier est une règle.
--
-- - Trois offres n'ont dans la spec qu'une seule bande de marché, sans
--   niveau. Elles sont rangées en « agence », le niveau médian, qui est la
--   position de KOV.
--
-- Il n'y a délibérément AUCUNE version tarifaire 2026. La spec ne donne de
-- paramètres de coût de revient que pour 2027 et 2028 ; en fabriquer pour
-- l'année en cours reviendrait à inventer le chiffre qui pilote toutes les
-- alertes bloquantes.


-- ── Versions tarifaires ──────────────────────────────────────────────────

insert into pricing_settings_versions (
  year, label, effective_from, regime,
  target_net_income_cents, contribution_rate_bp, fixed_costs_cents,
  depreciation_cents, billable_days, contribution_rate_confirmed,
  indexation_bp, vat_regime, vat_exemption_mention
) values
  -- Coût de revient obtenu : (18 000 + 8 440 + 1 000) / (123 × (1 − 0,258))
  -- = 300,66 €/jour. Le taux de 25,8 % est le taux BNC du régime général
  -- (25,6 % depuis le 1er janvier 2026) plus 0,2 % de contribution à la
  -- formation : un taux publié, d'où contribution_rate_confirmed = true.
  (2027, '2027 — micro-entreprise', '2027-01-01', 'micro',
   1800000, 2580, 844000, 100000, 123, true,
   0, 'franchise', 'TVA non applicable, art. 293 B du CGI'),

  -- Coût de revient obtenu : (26 400 × 1,45 + 15 720 + 1 500) / 130
  -- = 426,92 €/jour. Le taux TNS de 45 % est donné par la spec comme « un
  -- ordre de grandeur à confirmer avec l'expert-comptable », d'où
  -- contribution_rate_confirmed = false : l'écran le dira au lieu de le
  -- présenter comme acquis.
  (2028, '2028 — société à l''IS', '2028-01-01', 'is',
   2640000, 4500, 1572000, 150000, 130, false,
   500, 'franchise', 'TVA non applicable, art. 293 B du CGI');


-- ── Rôles ────────────────────────────────────────────────────────────────
--
-- Les taux de vente sont volontairement proches des TJM de freelances
-- confirmés, faute de portfolio établi. UX, FRONT et FULL se vendent SOUS
-- le coût d'un freelance du même rôle : c'est une réalité du modèle que
-- l'outil doit rendre visible par une alerte, pas corriger en douce dans
-- les données.

insert into pricing_roles (code, label, sell_rate_cents, freelance_cost_cents, internal_only, default_subcontracted, position) values
  ('STRAT',  'Cadrage et stratégie',                         48000, null,  true,  false, 1),
  ('UX',     'UX et architecture',                           44000, 45000, false, false, 2),
  ('UI',     'Direction artistique et design d''interface',  42000, 40000, false, false, 3),
  ('FRONT',  'Développement front et intégration',           42000, 43000, false, false, 4),
  ('FULL',   'Développement full-stack (Supabase, API)',     46000, 48000, false, false, 5),
  ('MOTION', 'Motion design et 3D WebGL',                    46000, 45000, false, false, 6),
  ('QA',     'Recette, SEO technique, mise en production',   38000, null,  true,  false, 7),
  ('COPY',   'Rédaction',                                    46000, 41100, false, true,  8),
  ('SEO',    'SEO éditorial',                                55000, 49900, false, true,  9),
  ('PHOTO',  'Photographie',                                 60000, 52200, false, true,  10);


-- ── Offres ───────────────────────────────────────────────────────────────

insert into pricing_offers (key, label, summary, reference_price_cents, external_costs_cents, lead_time_label, contingency_bp, payment_schedule, position) values
  ('landing', 'Landing page premium', 'Une page, conçue pour convertir.', 280000, 10000, '3 à 5 semaines', 0,
   '[{"label":"À la commande","percent_bp":5000,"round_code":null},
     {"label":"À la livraison","percent_bp":5000,"round_code":"R6"}]', 1),

  ('vitrine', 'Site vitrine premium', 'Six pages, design system léger, CMS.', 700000, 30000, '8 à 12 semaines', 0,
   '[{"label":"À la commande","percent_bp":4000,"round_code":null},
     {"label":"À la validation du design","percent_bp":3000,"round_code":"R3"},
     {"label":"À la recette","percent_bp":3000,"round_code":"R6"}]', 2),

  ('avance', 'Site premium avancé', 'Dix à vingt pages, design system complet, motion avancé.', 1350000, 120000, '14 à 20 semaines', 0,
   '[{"label":"À la commande","percent_bp":4000,"round_code":null},
     {"label":"À la validation du design","percent_bp":3000,"round_code":"R3"},
     {"label":"À la recette","percent_bp":3000,"round_code":"R6"}]', 3),

  ('outil', 'Outil métier ou espace client', 'Authentification, rôles, modèle de données, écrans sur mesure.', 1600000, 60000, '16 à 24 semaines', 1000,
   '[{"label":"À la commande","percent_bp":3000,"round_code":null},
     {"label":"À la validation des maquettes","percent_bp":2500,"round_code":"R3"},
     {"label":"À la version de recette","percent_bp":2500,"round_code":"R6"},
     {"label":"À la mise en production","percent_bp":2000,"round_code":"R6"}]', 4),

  ('immersif', 'Module immersif 3D WebGL', 'Vendu en complément d''un site.', 450000, 40000, null, 0,
   '[{"label":"À la commande","percent_bp":5000,"round_code":null},
     {"label":"À la livraison","percent_bp":5000,"round_code":"R6"}]', 5),

  ('audit', 'Audit UX, technique et SEO', 'Analyse et restitution.', 150000, 0, '2 à 3 semaines', 0,
   '[{"label":"À la commande","percent_bp":5000,"round_code":null},
     {"label":"À la livraison","percent_bp":5000,"round_code":"R6"}]', 6),

  -- Aucune composition par défaut, aucun prix de référence : « sur mesure »
  -- n'a pas de grille, donc l'alerte de calibrage ne s'y applique pas.
  ('sur-mesure', 'Sur mesure', 'Aucun module pré-coché.', null, 0, null, 0,
   '[{"label":"À la commande","percent_bp":5000,"round_code":null},
     {"label":"À la livraison","percent_bp":5000,"round_code":"R6"}]', 7);


-- ── Un raccourci d'écriture, supprimé à la fin ───────────────────────────
--
-- Soixante et un modules avec leurs jours par rôle écrits à plat feraient
-- plusieurs centaines de lignes d'INSERT où personne ne relirait rien.
-- Cette fonction n'existe que le temps de la migration.

create function pricing_seed_module(
  p_key text,
  p_label text,
  p_round text,
  p_role_days jsonb,
  p_span text default null,
  p_external_cents bigint default 0,
  p_quantity_unit text default null,
  p_optional boolean default false,
  p_offer_key text default null,
  p_position integer default 0,
  p_assumption text default null
) returns uuid
language plpgsql
as $$
declare
  v_module_id uuid;
  v_role text;
begin
  insert into pricing_modules (
    key, label, round_code, round_span_label, quantity_unit,
    external_costs_cents, is_optional, position, quote_assumption
  ) values (
    p_key, p_label, p_round, p_span, p_quantity_unit,
    p_external_cents, p_optional, p_position, p_assumption
  ) returning id into v_module_id;

  for v_role in select jsonb_object_keys(p_role_days) loop
    insert into pricing_module_role_days (module_id, role_code, days)
    values (v_module_id, v_role, (p_role_days ->> v_role)::numeric);
  end loop;

  if p_offer_key is not null then
    insert into pricing_offer_default_modules (offer_id, module_id, quantity, position)
    select id, v_module_id, 1, p_position from pricing_offers where key = p_offer_key;
  end if;

  return v_module_id;
end;
$$;


-- ── Compositions par défaut ──────────────────────────────────────────────

-- Landing page premium — 5,5 jours
select pricing_seed_module('landing-cadrage',   'Cadrage court et messages clés',                   'R0', '{"STRAT":0.5}',                       p_offer_key => 'landing', p_position => 1);
select pricing_seed_module('landing-structure', 'Structure de la page',                             'R1', '{"UX":0.5}',                          p_offer_key => 'landing', p_position => 2);
select pricing_seed_module('landing-design',    'Direction artistique et design desktop et mobile', 'R2', '{"UI":1.8}',       p_span => 'R2-R3', p_offer_key => 'landing', p_position => 3);
select pricing_seed_module('landing-build',     'Intégration Next.js',                              'R4', '{"FRONT":1.6}',                       p_offer_key => 'landing', p_position => 4);
select pricing_seed_module('landing-motion',    'Animations d''entrée et de scroll',                'R5', '{"MOTION":0.6}',                      p_offer_key => 'landing', p_position => 5);
select pricing_seed_module('landing-launch',    'Recette, analytics, mise en ligne',                'R6', '{"QA":0.5}',                          p_offer_key => 'landing', p_position => 6);

-- Site vitrine premium — 16 jours
select pricing_seed_module('vitrine-cadrage',      'Atelier de cadrage et note de cadrage',                               'R0', '{"STRAT":0.8}',            p_offer_key => 'vitrine', p_position => 1);
select pricing_seed_module('vitrine-architecture', 'Arborescence et wireframes (jusqu''à 6 pages)',                       'R1', '{"UX":1.6}',               p_offer_key => 'vitrine', p_position => 2);
select pricing_seed_module('vitrine-da',           'Direction artistique',                                                'R2', '{"UI":1.6}',               p_offer_key => 'vitrine', p_position => 3);
select pricing_seed_module('vitrine-design',       'Design de 6 pages, desktop et mobile, design system léger',           'R3', '{"UI":3.2}',               p_offer_key => 'vitrine', p_position => 4);
select pricing_seed_module('vitrine-build',        'Intégration Next.js et CMS',                                          'R4', '{"FRONT":4.4,"FULL":1.2}', p_offer_key => 'vitrine', p_position => 5);
select pricing_seed_module('vitrine-motion',       'Motion et micro-interactions standard',                               'R5', '{"MOTION":1.6}',           p_offer_key => 'vitrine', p_position => 6);
select pricing_seed_module('vitrine-launch',       'Recette, SEO technique, performance, analytics, mise en production',  'R6', '{"QA":1.6}',               p_offer_key => 'vitrine', p_position => 7);

-- Site premium avancé — 29 jours
select pricing_seed_module('avance-cadrage',      'Cadrage approfondi (deux ateliers)',                      'R0', '{"STRAT":1.5}',          p_offer_key => 'avance', p_position => 1);
select pricing_seed_module('avance-architecture', 'Architecture 10 à 20 pages, parcours, contenus',          'R1', '{"UX":3}',               p_offer_key => 'avance', p_position => 2);
select pricing_seed_module('avance-da',           'Direction artistique complète',                           'R2', '{"UI":2.5}',             p_offer_key => 'avance', p_position => 3);
select pricing_seed_module('avance-design',       'Design de 12 gabarits et design system',                  'R3', '{"UI":6}',               p_offer_key => 'avance', p_position => 4);
select pricing_seed_module('avance-build',        'Build Next.js et CMS riche',                              'R4', '{"FRONT":7,"FULL":2.5}', p_offer_key => 'avance', p_position => 5);
select pricing_seed_module('avance-motion',       'Motion avancé (scroll, transitions de page)',             'R5', '{"MOTION":3.5}',         p_offer_key => 'avance', p_position => 6);
select pricing_seed_module('avance-launch',       'Recette, SEO, performance, accessibilité, analytics',     'R6', '{"QA":3}',               p_offer_key => 'avance', p_position => 7);

-- Outil métier ou espace client — 36 jours
select pricing_seed_module('outil-cadrage',  'Cadrage fonctionnel et modèle de données',                   'R0', '{"STRAT":2,"FULL":1}',   p_offer_key => 'outil', p_position => 1);
select pricing_seed_module('outil-specs',    'Spécifications, parcours, wireframes',                       'R1', '{"UX":4}',               p_offer_key => 'outil', p_position => 2);
select pricing_seed_module('outil-da',       'Déclinaison de la direction artistique',                     'R2', '{"UI":1.5}',             p_offer_key => 'outil', p_position => 3);
select pricing_seed_module('outil-design',   'Design des écrans (environ 12) et composants',               'R3', '{"UI":4.5}',             p_offer_key => 'outil', p_position => 4);
select pricing_seed_module('outil-build',    'Authentification, rôles, modèle de données, RLS, écrans',    'R4', '{"FULL":10,"FRONT":6}',  p_offer_key => 'outil', p_position => 5);
select pricing_seed_module('outil-polish',   'Polish et micro-interactions',                               'R5', '{"MOTION":1}',           p_offer_key => 'outil', p_position => 6);
select pricing_seed_module('outil-recette',  'Recette, sécurité, mise en production, tests',               'R6', '{"QA":3,"FULL":1}',      p_offer_key => 'outil', p_position => 7);
select pricing_seed_module('outil-pilotage', 'Pilotage et recette avec le client',                         'R0', '{"STRAT":2}', p_span => 'R0-R6', p_offer_key => 'outil', p_position => 8);

-- Module immersif 3D WebGL — 10 jours
select pricing_seed_module('immersif-cadrage', 'Cadrage de la scène',                              'R0', '{"STRAT":0.5}',              p_offer_key => 'immersif', p_position => 1);
select pricing_seed_module('immersif-concept', 'Concept visuel 3D',                                'R2', '{"UI":1.5}',                 p_offer_key => 'immersif', p_position => 2);
select pricing_seed_module('immersif-build',   'Scène Three.js ou React Three Fiber, optimisation','R4', '{"MOTION":6.5,"FRONT":0.5}', p_offer_key => 'immersif', p_position => 3);
select pricing_seed_module('immersif-perf',    'Tests de performance multi-appareils',             'R6', '{"QA":1}',                   p_offer_key => 'immersif', p_position => 4);

-- Audit UX, technique et SEO — 3 jours
select pricing_seed_module('audit-strategie', 'Analyse stratégique et restitution', 'R0', '{"STRAT":1}', p_span => 'R0-R6', p_offer_key => 'audit', p_position => 1);
select pricing_seed_module('audit-ux',        'Audit UX',                           'R1', '{"UX":1}',                       p_offer_key => 'audit', p_position => 2);
select pricing_seed_module('audit-technique', 'Audit performance et SEO technique', 'R6', '{"QA":1}',                       p_offer_key => 'audit', p_position => 3);


-- ── Modules optionnels ───────────────────────────────────────────────────

select pricing_seed_module('opt-page-supplementaire', 'Page supplémentaire sur gabarit existant', 'R3', '{"UI":0.3,"FRONT":0.4}',              p_span => 'R3-R4', p_quantity_unit => 'page',    p_optional => true, p_position => 1);
select pricing_seed_module('opt-nouveau-gabarit',     'Nouveau gabarit de page',                  'R3', '{"UI":1,"FRONT":1}',                  p_span => 'R3-R4', p_quantity_unit => 'gabarit', p_optional => true, p_position => 2);
select pricing_seed_module('opt-multilingue',         'Version multilingue (hors traduction)',    'R4', '{"FRONT":1,"FULL":0.5,"QA":0.5}',                        p_quantity_unit => 'langue',  p_optional => true, p_position => 3);
select pricing_seed_module('opt-traduction',          'Traduction professionnelle',               'R4', '{}',                                  p_external_cents => 40000, p_quantity_unit => 'langue (jusqu''à 3 000 mots)', p_optional => true, p_position => 4);
select pricing_seed_module('opt-redaction',           'Rédaction des contenus',                   'R1', '{"COPY":0.5}',                        p_span => 'R1-R3', p_quantity_unit => 'page',    p_optional => true, p_position => 5);
select pricing_seed_module('opt-shooting',            'Shooting photo',                           'R2', '{"PHOTO":0.5}',                       p_external_cents => 10000, p_quantity_unit => 'demi-journée', p_optional => true, p_position => 6);
select pricing_seed_module('opt-blog',                'Blog ou actualités (gabarits, CMS, 3 articles intégrés)', 'R3', '{"UI":1,"FRONT":1.5,"FULL":0.5}', p_span => 'R3-R4',                     p_optional => true, p_position => 7);
select pricing_seed_module('opt-formulaire-crm',      'Formulaire qualifié et envoi vers le CRM', 'R4', '{"FRONT":0.5,"FULL":1}',                                                              p_optional => true, p_position => 8);
select pricing_seed_module('opt-rdv',                 'Prise de rendez-vous intégrée',            'R4', '{"FRONT":0.5}',                                                                       p_optional => true, p_position => 9);
select pricing_seed_module('opt-simulateur',          'Simulateur ou calculateur',                'R1', '{"UX":1,"UI":0.5,"FRONT":2,"FULL":1}',p_span => 'R1-R4', p_quantity_unit => 'simulateur', p_optional => true, p_position => 10);
select pricing_seed_module('opt-espace-client',       'Espace client simple (connexion, documents partagés)', 'R1', '{"UI":1,"FRONT":2,"FULL":4,"QA":1}', p_span => 'R1-R6',                     p_optional => true, p_position => 11);
select pricing_seed_module('opt-ecran-dashboard',     'Écran de tableau de bord supplémentaire',  'R3', '{"UI":0.5,"FRONT":1,"FULL":0.5}',     p_span => 'R3-R4', p_quantity_unit => 'écran',   p_optional => true, p_position => 12);
select pricing_seed_module('opt-api-tierce',          'Intégration d''API tierce',                'R4', '{"FULL":1.5}',                                           p_quantity_unit => 'intégration', p_optional => true, p_position => 13);
select pricing_seed_module('opt-roles-avances',       'Rôles et permissions avancés',             'R4', '{"FULL":2}',                                                                          p_optional => true, p_position => 14);
select pricing_seed_module('opt-scroll-avance',       'Animation de scroll avancée ou transitions de page', 'R5', '{"MOTION":2}',                                                               p_optional => true, p_position => 15);
select pricing_seed_module('opt-scene-3d-hero',       'Scène 3D en hero',                         'R2', '{"UI":1,"MOTION":4}',                 p_span => 'R2-R5',                               p_optional => true, p_position => 16);
select pricing_seed_module('opt-visite-360',          'Visite 360°',                              'R4', '{"MOTION":1}',                        p_external_cents => 15000, p_quantity_unit => 'scène', p_optional => true, p_position => 17);
select pricing_seed_module('opt-modele-3d',           'Modèle 3D sur mesure (objet simple)',      'R4', '{"MOTION":1.5}',                                         p_quantity_unit => 'objet',   p_optional => true, p_position => 18);
select pricing_seed_module('opt-design-system',       'Design system documenté (Figma et composants)', 'R3', '{"UI":2,"FRONT":2}',             p_span => 'R3-R4',                               p_optional => true, p_position => 19);
select pricing_seed_module('opt-accessibilite',       'Audit d''accessibilité simplifié',         'R6', '{"QA":1.5}',                                                                          p_optional => true, p_position => 20);
select pricing_seed_module('opt-seo-editorial',       'SEO éditorial initial (mots-clés, 10 pages)', 'R1', '{"SEO":2}',                                                                        p_optional => true, p_position => 21);
select pricing_seed_module('opt-migration',           'Migration de contenus depuis l''ancien site', 'R4', '{"FRONT":1}',                                         p_quantity_unit => 'tranche de 20 pages', p_optional => true, p_position => 22);
select pricing_seed_module('opt-formation-cms',       'Formation au CMS',                         'R6', '{"STRAT":0.5}',                                          p_quantity_unit => 'demi-journée', p_optional => true, p_position => 23);
select pricing_seed_module('opt-infra-client',        'Infrastructure au nom du client (Vercel, Supabase)', 'R6', '{"FULL":0.5}',                                                              p_optional => true, p_position => 24);

-- Les deux modules qui poussent une hypothèse dans le devis. La spec
-- l'exige pour les pages légales : la validation des mentions relève du
-- client, et cela doit être écrit noir sur blanc plutôt que sous-entendu.
select pricing_seed_module('opt-pages-legales', 'Pages légales et bandeau cookies (structure technique)', 'R4', '{"UX":0.5,"FRONT":0.5}', p_optional => true, p_position => 25,
  p_assumption => 'La structure technique des pages légales et du bandeau cookies est fournie par KOV. La rédaction et la validation juridique des mentions relèvent du client.');

select pricing_seed_module('opt-cadrage-autonome', 'Cadrage payant autonome, déductible en cas de signature', 'R0', '{"STRAT":2}', p_optional => true, p_position => 26,
  p_assumption => 'Le montant de ce cadrage est déduit du devis de production si celui-ci est signé dans les trois mois.');

drop function pricing_seed_module(text, text, text, jsonb, text, bigint, text, boolean, text, integer, text);


-- ── Abonnements ──────────────────────────────────────────────────────────

insert into pricing_subscriptions (key, label, description, monthly_price_cents, monthly_days, monthly_external_cents, monthly_role_code, min_commitment_months, position) values
  ('essentiel',     'Essentiel',            'Mises à jour, monitoring, sauvegardes, hébergement géré, 1 h de support.',                              9500, 0.15, 1000, 'QA',    0,  1),
  ('evolution',     'Évolution',            'Essentiel, évolutions, suivi analytics trimestriel, SEO.',                                             42000, 0.70, 1500, 'FRONT', 12, 2),
  ('support-outil', 'Support outil métier', 'Infrastructure dédiée, supervision, correctifs, 1 jour d''évolutions, délai d''intervention garanti.', 80000, 1.20, 5000, 'FULL',  12, 3);


-- ── Bandes de marché ─────────────────────────────────────────────────────
--
-- Hypothèses KOV, éditables. max_cents null = bande ouverte vers le haut :
-- une borne inventée serait plus fausse qu'une borne absente.

insert into pricing_market_bands (offer_id, tier, min_cents, max_cents, position)
select o.id, b.tier, b.min_cents, b.max_cents, b.position
from pricing_offers o
join (values
  ('landing',  'freelance',  80000,  200000, 1),
  ('landing',  'agence',    200000,  400000, 2),
  ('landing',  'premium',   400000,    null, 3),
  ('vitrine',  'freelance', 100000,  500000, 1),
  ('vitrine',  'agence',    350000,  800000, 2),
  ('vitrine',  'premium',   800000, 1500000, 3),
  ('avance',   'agence',   1000000, 2000000, 1),
  ('avance',   'premium',  2000000,    null, 2),
  ('outil',    'agence',    900000, 3500000, 1),
  ('immersif', 'agence',    250000, 1200000, 1),
  ('audit',    'agence',     90000,  300000, 1)
) as b(offer_key, tier, min_cents, max_cents, position) on b.offer_key = o.key;


-- ── Références de marché ─────────────────────────────────────────────────
--
-- Saisies à la main, avec leur source et leur date de consultation. Les
-- valeurs Malt portent sur des freelances expérimentés actifs sur les trois
-- derniers mois. `nature` distingue une statistique de plateforme de trois
-- profils regardés un par un : les deux ne se citent pas de la même façon
-- devant un client.

insert into pricing_market_benchmarks (label, value_cents, value_max_cents, unit, seniority, zone, source, source_url, consulted_at, nature) values
  ('Développeur full-stack',        55700,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack', '2026-09-27', 'platform_statistic'),
  ('Développeur full-stack',        53500,   null, 'day',     'expérimenté', 'Bordeaux', 'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack', '2026-09-27', 'platform_statistic'),
  ('Développeur full-stack',        42600,   null, 'day',     '3 à 7 ans',   'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack', '2026-09-27', 'platform_statistic'),
  ('Développeur full-stack',        31100,   null, 'day',     '0 à 2 ans',   'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack', '2026-09-27', 'platform_statistic'),
  ('Développeur ReactJS',           56300,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-frontend/developpeur-reactjs', '2026-09-27', 'platform_statistic'),
  ('Développeur ReactJS',           42000,   null, 'day',     '3 à 7 ans',   'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/tech/developpeur-frontend/developpeur-reactjs', '2026-09-27', 'platform_statistic'),
  ('Webdesigner',                   42300,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner', '2026-09-27', 'platform_statistic'),
  ('Webdesigner',                   42100,   null, 'day',     'expérimenté', 'Bordeaux', 'Malt', 'https://www.malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner', '2026-09-27', 'platform_statistic'),
  ('Webdesigner',                   34000,   null, 'day',     '3 à 7 ans',   'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner', '2026-09-27', 'platform_statistic'),
  ('UX designer',                   50700,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner', '2026-09-27', 'platform_statistic'),
  ('Directeur artistique',          40200,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner', '2026-09-27', 'platform_statistic'),
  ('Motion designer',               41900,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/image-son/motion-designer', '2026-09-27', 'platform_statistic'),
  ('Motion designer',               33400,   null, 'day',     '3 à 7 ans',   'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/image-son/motion-designer', '2026-09-27', 'platform_statistic'),
  ('Photographe',                   52200,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/image-son', '2026-09-27', 'platform_statistic'),
  ('Concepteur-rédacteur',          41100,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/communication/concepteur-redacteur', '2026-09-27', 'platform_statistic'),
  ('Rédacteur web',                 37300,   null, 'day',     'expérimenté', 'France',   'Malt', 'https://www.malt.fr/t/barometre-tarifs/communication/redacteur-web', '2026-09-27', 'platform_statistic'),
  ('Consultant SEO',                49900,   null, 'day',     null,          'France',   'Baromètre Malt 2026 cité par mission-freelances.fr', null, '2026-09-27', 'secondary_source'),
  ('Développeur Three.js / WebGL',  35000,  50000, 'day',     null,          'France',   'Profils Malt consultés individuellement',            null, '2026-09-27', 'individual_observation'),
  ('Site vitrine par un freelance',100000, 500000, 'project', null,          'France',   'Pages tarifaires d''agences et de plateformes, 2026', null, '2026-09-27', 'commercial_page'),
  ('Site vitrine par une agence',  350000, 800000, 'project', null,          'France',   'Pages tarifaires d''agences et de plateformes, 2026', null, '2026-09-27', 'commercial_page'),
  ('Site sur mesure en agence',   1500000,   null, 'project', null,          'France',   'Pages tarifaires d''agences et de plateformes, 2026', null, '2026-09-27', 'commercial_page'),
  ('Maintenance technique de site',  6000,  25000, 'month',   null,          'France',   'Pages tarifaires d''agences et de plateformes, 2026', null, '2026-09-27', 'commercial_page');


-- ── Textes du devis ──────────────────────────────────────────────────────
--
-- Français sobre, aucun superlatif, et aucun tiret cadratin ni demi-cadratin.

insert into pricing_text_templates (key, kind, body, position) values
  ('included-rounds',      'included',   'Les rounds de production listés ci-dessus, dans leur intégralité.', 1),
  ('included-revisions',   'included',   'Deux cycles de retours par round.', 2),
  ('included-handover',    'included',   'La mise en production et la remise des accès.', 3),

  ('excluded-content',     'excluded',   'La rédaction des contenus et la fourniture des visuels, sauf module explicitement retenu.', 1),
  ('excluded-licences',    'excluded',   'Les licences, polices et banques d''images payantes, facturées au réel si le projet en retient.', 2),
  ('excluded-hosting',     'excluded',   'Les abonnements d''hébergement et de services tiers souscrits au nom du client.', 3),
  ('excluded-scope',       'excluded',   'Toute évolution hors du périmètre décrit ci-dessus.', 4),

  ('assumption-content',   'assumption', 'Les contenus (textes, images, accès) sont fournis par le client avant le début du round R3.', 1),
  ('assumption-revisions', 'assumption', 'Au-delà de deux cycles de retours par round, les retours supplémentaires sont facturés au taux journalier en vigueur.', 2),
  ('assumption-scope',     'assumption', 'Les évolutions hors périmètre font l''objet d''un avenant, facturé au taux journalier en vigueur.', 3),
  ('assumption-pause',     'assumption', 'En cas de suspension imputable au client de plus de quatre semaines, le jalon suivant est facturé à la date de suspension.', 4),
  ('assumption-launch',    'assumption', 'La mise en production intervient après règlement du solde.', 5);


commit;


-- ── Récapitulatif ────────────────────────────────────────────────────────

select
  (select count(*) from information_schema.tables
     where table_schema = 'public' and table_name like 'pricing_%')  as tables,
  (select count(*) from pricing_settings_versions)                     as versions_tarifaires,
  (select count(*) from pricing_roles)                                 as roles,
  (select count(*) from pricing_offers)                                as offres,
  (select count(*) from pricing_modules)                               as modules,
  (select count(*) from pricing_market_benchmarks)                     as references_marche,
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles'
       and column_name in ('address_street','address_postal_code','address_city',
                           'address_country','siren','vat_number'))    as colonnes_profiles;
