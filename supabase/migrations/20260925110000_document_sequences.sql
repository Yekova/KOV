-- Numérotation séquentielle des devis et des factures.
--
-- Jusqu'ici `reference` était un champ de texte libre avec un placeholder,
-- et l'unicité n'était garantie que par une contrainte qui se manifestait
-- sous la forme « La création du devis a échoué (référence déjà utilisée ?) ».
-- Pour une entreprise française, l'article 242 nonies A du CGI impose aux
-- factures une numérotation chronologique et continue, sans rupture.
--
-- ── POURQUOI UN TRIGGER ET PAS UNE SEQUENCE ──────────────────────────────
--
-- C'est le piège de ce sujet, et il est contre-intuitif : une SEQUENCE
-- Postgres est exactement le mauvais outil ici. nextval() est délibérément
-- NON transactionnel — c'est sa raison d'être, permettre à plusieurs
-- transactions d'avancer sans se bloquer. Conséquence : une insertion
-- annulée consomme définitivement son numéro et laisse un trou. Une
-- SEQUENCE est conçue pour produire des trous ; la loi les interdit.
--
-- Les deux autres solutions évidentes échouent pour la même famille de
-- raisons : `select max(reference) + 1` puis insert depuis JavaScript, ou
-- une table compteur lue puis écrite depuis JavaScript, font deux
-- transactions séparées — supabase-js ne sait pas en tenir une. Un double
-- clic suffit à les mettre en défaut.
--
-- Un trigger BEFORE INSERT, lui, alloue le numéro DANS la transaction de
-- l'insertion du document. Une insertion qui échoue libère son numéro. Et
-- comme il vit en base, il couvre tous les chemins d'écriture — createInvoice,
-- convertQuoteToInvoice, et ceux qui n'existent pas encore.

create table if not exists document_sequences (
  kind text not null check (kind in ('invoice', 'quote')),
  year integer not null,
  next_number integer not null,
  primary key (kind, year)
);

comment on table document_sequences is
  'Compteur par série (type, année). Alimenté uniquement par le trigger assign_document_reference ci-dessous, donc l''allocation se fait dans la transaction du document : un échec d''insertion libère le numéro. Volontairement PAS une SEQUENCE Postgres, qui produirait des trous.';

create or replace function assign_document_reference()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_kind text := tg_argv[0];
  v_prefix text := tg_argv[1];
  v_year integer;
  v_number integer;
begin
  -- Une référence fournie à la main est respectée telle quelle : c'est
  -- l'échappatoire pour reprendre un historique, et c'est aussi ce qui rend
  -- ce trigger sans effet sur tout ce qui existe déjà.
  if new.reference is not null and btrim(new.reference) <> '' then
    return new;
  end if;

  v_year := extract(year from coalesce(new.created_at, now()));

  -- on conflict do update prend un verrou de ligne, donc deux insertions
  -- simultanées se sérialisent. Le returning couvre les deux branches :
  -- première insertion, on stocke 2 et on rend 1 ; conflit, on stocke n+1
  -- et on rend n.
  insert into document_sequences (kind, year, next_number)
  values (v_kind, v_year, 2)
  on conflict (kind, year)
    do update set next_number = document_sequences.next_number + 1
  returning next_number - 1 into v_number;

  new.reference := format('%s-%s-%s', v_prefix, v_year, lpad(v_number::text, 3, '0'));
  return new;
end;
$$;

drop trigger if exists invoices_assign_reference on invoices;
create trigger invoices_assign_reference
  before insert on invoices
  for each row execute function assign_document_reference('invoice', 'F');

drop trigger if exists quotes_assign_reference on quotes;
create trigger quotes_assign_reference
  before insert on quotes
  for each row execute function assign_document_reference('quote', 'D');


-- ── Amorçage ─────────────────────────────────────────────────────────────
--
-- Les références existantes ont été lues à la main, pas analysées par un
-- programme : F-5001BA, F-5001CB pour les factures, F-5001BA, F-5001BAA,
-- F-5001CB pour les devis. Elles ne forment aucune séquence et les devis
-- réutilisent même le préfixe des factures. Il n'y a donc rien à
-- poursuivre : les deux séries commencent à 1, et le nouveau format
-- (F-2026-001, D-2026-001) ne peut entrer en collision avec l'ancien.
--
-- Les anciennes lignes gardent leur texte. La continuité commence
-- aujourd'hui, elle ne se réécrit pas rétroactivement.

insert into document_sequences (kind, year, next_number) values
  ('invoice', 2026, 1),
  ('quote', 2026, 1)
on conflict (kind, year) do nothing;


-- ── La suppression d'une facture numérotée ───────────────────────────────
--
-- deleteInvoice ne refusait que les factures payées. Une facture déjà
-- envoyée au client, déjà numérotée, pouvait donc être supprimée
-- définitivement — c'est-à-dire laisser exactement le trou que la
-- numérotation ci-dessus sert à empêcher.
--
-- Le garde-fou vit en base et non seulement dans l'application, parce que
-- le tableau de bord Supabase est précisément l'endroit où quelqu'un irait
-- « réparer » une facture à la main.
--
-- Il ne s'applique qu'aux références produites par la séquence : les
-- références historiques saisies à la main restent supprimables, puisque
-- aucune continuité ne repose sur elles. La contrainte porte exactement là
-- où porte la loi.

create or replace function forbid_numbered_invoice_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.reference ~ '^F-\d{4}-\d{3,}$' then
    raise exception 'Facture % : une facture numérotée ne se supprime pas, elle s''annule (statut « cancelled »). La numérotation doit rester continue.', old.reference
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

drop trigger if exists invoices_forbid_numbered_delete on invoices;
create trigger invoices_forbid_numbered_delete
  before delete on invoices
  for each row execute function forbid_numbered_invoice_delete();
