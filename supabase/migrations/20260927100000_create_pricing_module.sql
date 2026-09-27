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
