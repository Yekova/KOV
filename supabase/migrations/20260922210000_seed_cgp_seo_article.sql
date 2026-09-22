-- Un article sur le referencement d'un cabinet de gestion de patrimoine.
--
-- Deuxieme article du groupe patrimoine. Il vise le meme lecteur que
-- l'article sur le site de CGP, mais plus tot dans sa reflexion : il ne
-- cherche pas encore un site, il cherche des clients. La section
-- referencement du premier article est deliberement courte, celui-ci la
-- developpe sans la repeter, et les deux se lient.
--
-- Aucun tiret cadratin, ni dans l'article ni dans ces commentaires.
--
-- Sur ce qu'il affirme : aucun volume de recherche, aucun delai, aucun
-- resultat, aucun prix, aucun temoignage. Rien sur ce qu'un cabinet a le
-- droit d'afficher : l'article renvoie explicitement a l'association du
-- lecteur, qui fait autorite, et le dit en toutes lettres pour les avis
-- clients. Kanti n'est cite que pour ce que /projets dit deja publiquement.
--
-- cover_image_path reste null : la couverture se choisit depuis l'admin.
--
-- on conflict do nothing : rejouer les migrations ne doit ni dupliquer
-- l'article, ni ecraser une version que le proprietaire aurait editee depuis.

insert into posts (
  slug, title, excerpt, body, cover_image_path, status, published_at,
  tag, date_label, reading_time, featured,
  meta_title, meta_description, author_name, client_display_name
) values (
  'referencement-cabinet-gestion-patrimoine',
  'Comment un cabinet de gestion de patrimoine est trouvé sur Google',
  'Personne ne devient client en tapant « gestion de patrimoine ». Trois portes mènent réellement à un cabinet, et elles ne se travaillent pas de la même façon.',
  $article$
<p>Personne ne devient client d'un cabinet en tapant « gestion de patrimoine » dans Google.</p>

<p>C'est la première chose à admettre, parce qu'elle réoriente tout le travail. Cette requête est disputée par des comparateurs, des banques et des plateformes dont ce n'est même pas le métier, et celui qui la tape est presque toujours en train de se documenter, pas de choisir quelqu'un.</p>

<p>Trois portes mènent réellement à un cabinet. Elles se travaillent séparément, et la plupart des cabinets n'en ouvrent aucune.</p>

<h2>Porte 1 : votre ville</h2>

<p>« Conseiller en gestion de patrimoine » suivi d'un nom de ville est une recherche à très forte intention. Celui qui la formule veut rencontrer quelqu'un, pas lire un article.</p>

<p>Cette porte se gagne d'abord en dehors de votre site, sur votre fiche d'établissement. Elle suppose une adresse réelle et vérifiable, une catégorie d'activité juste, des horaires tenus à jour, et une cohérence stricte entre ce qui est écrit là et ce qui est écrit sur votre site.</p>

<p>Le point sensible est l'adresse. Beaucoup de cabinets exercent depuis un bureau personnel, et publier cette adresse est une décision qui n'est pas anodine. Il existe des réponses, domiciliation, bureau partagé, présentation par zone d'intervention, mais il n'y en a pas de gratuite. Tranchez-la consciemment plutôt que de laisser la fiche vide, parce qu'une fiche absente vous retire de la porte la plus qualifiée des trois.</p>

<h2>Porte 2 : les questions que vos clients se posent</h2>

<p>C'est la porte la plus large, et la seule qui se construit entièrement chez vous.</p>

<p>Vos futurs clients ne cherchent pas un métier, ils cherchent la sortie d'une situation. Que faire après la vente de son entreprise. Comment organiser une succession sans léser personne. S'il faut un conseiller quand on n'est pas fortuné. Ce qui change au moment du départ à la retraite. Chacune de ces questions est une page, et chaque page est une occasion d'être trouvé par quelqu'un qui a déjà le problème que vous savez traiter.</p>

<p>Une règle de fabrication, une seule : une question par page, et la réponse dans les premières lignes. Une page qui traite huit sujets ne se positionne sur aucun, et une réponse qui arrive après six cents mots de mise en contexte n'est jamais lue.</p>

<p>La contrainte du métier ne vous gêne pas ici, contrairement à ce qu'on croit souvent. Vous n'avez rien à promettre : vous décrivez une situation, les questions qu'elle soulève et la façon dont on l'aborde. C'est exactement ce qu'un lecteur inquiet cherche, et c'est ce que nous développions dans notre article sur <a href="/journal/site-internet-conseiller-gestion-patrimoine">le site d'un conseiller en gestion de patrimoine</a>.</p>

<blockquote>Vos clients ne cherchent pas votre métier. Ils cherchent la sortie d'une situation.</blockquote>

<h2>Porte 3 : votre nom</h2>

<p>Celle-ci est la plus négligée et pourtant la plus décisive, parce qu'elle suit la recommandation.</p>

<p>Quelqu'un vous a été recommandé. Avant d'appeler, il tape votre nom, ou celui du cabinet. Ce qu'il trouve à ce moment-là ne lui apprend pas qui vous êtes, il vérifie que ce qu'on lui a dit tient debout. Une page qui confirme, avec votre immatriculation lisible et votre méthode décrite, conclut la recommandation. Une absence de résultat la fragilise.</p>

<p>Sur la question des avis et des retours clients affichés, les règles dépendent de votre statut et de votre association professionnelle : c'est elle qui fait autorité, et poser la question avant de publier coûte moins cher que de la poser après.</p>

<h2>Ce qui ne marche pas pour un cabinet</h2>

<p>Acheter du trafic sur des termes génériques amène des visiteurs qui ne cherchent pas un conseiller, et les qualifier vous coûtera plus que ce qu'ils rapportent.</p>

<p>Publier pour publier ne fonctionne pas davantage. Un cabinet n'a pas besoin de volume : il a besoin d'un nombre restreint de bonnes personnes par an, ce qui est un objectif très différent et beaucoup plus atteignable. Quatre pages qui répondent vraiment valent mieux que quarante qui effleurent.</p>

<p>Enfin, et c'est la faute la plus tentante dans un métier où l'on ne peut rien promettre : inventer des chiffres pour paraître solide. Ils seront recoupés, par un lecteur ou par un moteur, et une source contredite est une source qu'on cesse de croire.</p>

<h2>Le détail qui annule tout le reste</h2>

<p>Des pages excellentes vers lesquelles rien ne pointe ne servent à rien.</p>

<p>C'est une erreur que nous avons commise sur notre propre site et qu'il a fallu mesurer pour la voir : des pages publiées, valides, correctement écrites, et vers lesquelles aucun lien du site ne menait. Elles étaient invisibles autrement qu'en connaissant leur adresse.</p>

<p>Le test tient en une minute par page : depuis votre page d'accueil, pouvez-vous atteindre cette page en cliquant, sans taper d'adresse ? Si la réponse est non, corrigez cela avant d'écrire la page suivante.</p>

<h2>Mesurer sans se raconter d'histoires</h2>

<p>Le nombre de visiteurs n'est pas un indicateur pertinent pour un cabinet. Deux le sont.</p>

<p>Le premier : quelles questions ont amené quelqu'un jusqu'à vous. Elles vous disent quoi écrire ensuite, et elles vous le disent mieux que n'importe quelle liste de mots-clés achetée.</p>

<p>Le second : combien de prises de contact, et surtout lesquelles étaient pertinentes. Un formulaire qui demande la situation et l'échéance vous donne cette réponse directement, sans avoir à qualifier au téléphone une par une les demandes qui arrivent.</p>

<h2>Par où commencer</h2>

<p>Par une seule question, choisie parce que vous l'entendez souvent en rendez-vous, traitée jusqu'au bout sur une page qui lui est dédiée. Puis la fiche d'établissement, qui demande une heure et ouvre la porte la plus qualifiée. Puis une deuxième question.</p>

<p>Ce rythme paraît lent. Il l'est moins qu'une refonte complète décidée sans savoir ce que vos visiteurs cherchent, et il produit de l'information utile dès la première page.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>Un cabinet ne se rend pas visible en se plaçant sur le nom de son métier. Il se rend visible sur son territoire, sur les situations qu'il sait traiter, et sur son propre nom. Les trois portes sont indépendantes, aucune ne compense l'absence des deux autres.</p>

<p>C'est le travail que nous avons mené pour un cabinet de gestion de patrimoine, visible dans nos <a href="/projets">réalisations</a>, et c'est ce que recouvre la <a href="/expertise/strategie">stratégie</a> dans notre façon de travailler. Nos réponses aux questions les plus fréquentes sont rassemblées dans notre <a href="/faq">FAQ</a>. Si vous voulez savoir laquelle des trois portes vous manque, <a href="/contact">parlez-nous de votre cabinet</a> : on regarde, et on vous le dit.</p>
$article$,
  null,
  'published',
  now(),
  'Gestion de patrimoine',
  'Septembre 2026',
  '5 min',
  false,
  'Référencement d''un cabinet de gestion de patrimoine | KOV',
  'Personne ne devient client en tapant « gestion de patrimoine ». Trois portes mènent réellement à un cabinet : la ville, les situations, et votre nom.',
  'KOV',
  null
)
on conflict (slug) do nothing;
