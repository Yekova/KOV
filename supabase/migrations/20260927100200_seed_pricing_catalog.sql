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
