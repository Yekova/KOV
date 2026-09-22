-- An article aimed at conseillers en gestion de patrimoine.
--
-- Seeded rather than typed into /admin/content because it is 1,400 words of
-- HTML and pasting that into an editor by hand is how a paragraph goes
-- missing. It is a normal post once inserted: editable, publishable and
-- deletable from the admin like any other, and dollar-quoted here so not a
-- single French apostrophe has to be escaped.
--
-- On what it claims: nothing about results, no figures, no timelines, no
-- prices. The regulatory paragraphs describe the French framework in general
-- terms and say in the article itself that they are not legal advice and
-- that the reader's association is the authority. Kanti is referenced
-- because it is already public on /projets, and only for what that page
-- already says about it.
--
-- on conflict do nothing: re-running migrations must not duplicate a post,
-- and must not silently overwrite one the owner has since edited.

insert into posts (
  slug, title, excerpt, body, cover_image_path, status, published_at,
  tag, date_label, reading_time, featured,
  meta_title, meta_description, author_name, client_display_name
) values (
  'site-internet-conseiller-gestion-patrimoine',
  'Site internet de CGP : ce que vos prospects vérifient avant de vous appeler',
  'Un cabinet de gestion de patrimoine ne se choisit pas comme un restaurant. Ce que votre site doit prouver, dans quel ordre, et pourquoi un beau site ne suffit pas.',
  $article$
<p>Un prospect qui cherche un conseiller en gestion de patrimoine ne compare pas des sites. Il cherche une raison de faire confiance à quelqu'un à qui il va parler d'argent, de famille et de succession. Votre site est le premier endroit où il la cherche, et il la cherche dans un ordre très précis.</p>

<p>Cet ordre est rarement celui dans lequel les sites de cabinet sont construits.</p>

<h2>Un site de CGP n'est pas un site vitrine</h2>

<p>Un site vitrine a un travail simple : montrer et séduire. Un site de cabinet patrimonial en a un autre, beaucoup plus exigeant : <strong>établir une légitimité avant d'établir une envie</strong>. Le visiteur n'arrive pas indécis entre vous et un concurrent. Il arrive méfiant, souvent mal informé sur ce que fait réellement un CGP, et parfois échaudé par un démarchage.</p>

<p>Ça change tout dans la hiérarchie de la page. Une photo de poignée de main et une phrase sur « votre avenir serein » ne répondent à aucune des questions qu'il se pose. Ce qu'il veut savoir tient en quatre points : qui vous êtes, si vous êtes autorisé à exercer, ce que vous faites exactement, et ce qui se passe s'il vous écrit.</p>

<h2>Ce qu'un prospect vérifie en premier : que vous existez vraiment</h2>

<p>La profession est encadrée, et vos prospects le savent de mieux en mieux. Beaucoup vérifient avant d'appeler : l'immatriculation ORIAS, le statut, l'association professionnelle agréée à laquelle vous adhérez, l'assurance de responsabilité civile professionnelle.</p>

<p>Ces informations existent dans tous les cabinets. Elles sont presque toujours reléguées dans les mentions légales, en bas de page, en gris clair. C'est une erreur de hiérarchie : ce sont vos éléments de preuve les plus forts, et ils sont rangés là où l'on met ce qu'on est obligé d'afficher.</p>

<p>Les remonter n'est pas un travail juridique, c'est un travail d'architecture de l'information. Un numéro d'immatriculation visible, vérifiable et daté vaut mieux que trois paragraphes sur votre engagement.</p>

<blockquote>Ce n'est pas un article de conformité. Les règles applicables à votre communication dépendent de votre statut et de votre association : c'est elle qui fait autorité, pas nous.</blockquote>

<h2>Dire ce que vous faites sans promettre ce que vous ne pouvez pas promettre</h2>

<p>C'est la contrainte propre au métier, et c'est aussi une contrainte de conception. Vous ne pouvez pas afficher de performance, pas garantir de résultat, pas mettre en avant un rendement. La tentation est alors de compenser par du vocabulaire : « optimisation », « sur-mesure », « accompagnement global », « approche 360 ». Des mots que tous vos concurrents utilisent aussi, et qui ne disent rien.</p>

<p>La sortie n'est pas d'en promettre plus. Elle est d'être <strong>plus concret sur le processus que sur le résultat</strong>. Ce que vous ne pouvez pas dire sur la performance, vous pouvez le dire sur la méthode : comment se déroule un premier rendez-vous, ce que vous regardez, en combien de temps, ce que le client reçoit, comment vous êtes rémunéré.</p>

<p>La transparence sur la méthode est le seul terrain où un cabinet peut se différencier sans rien promettre. C'est aussi, de loin, ce que les visiteurs lisent le plus.</p>

<h2>Structurer une offre qui est, par nature, complexe</h2>

<p>C'est le problème que nous avons rencontré en travaillant pour <a href="/projets">Kanti</a>, un cabinet de gestion de patrimoine : une offre réelle, sérieuse, et impossible à saisir d'un coup d'œil. Immobilier, placements financiers, transmission, fiscalité, retraite, protection du dirigeant — chaque brique est légitime, et mises côte à côte elles forment un mur.</p>

<p>Un visiteur ne lit pas un mur. Il cherche <em>son</em> cas : « je vends mon entreprise », « je viens d'hériter », « je prépare ma retraite ». Une offre organisée par produit oblige chaque prospect à traduire lui-même sa situation en catégorie — et la plupart ne font pas cet effort, ils partent.</p>

<p>L'arbitrage est donc souvent le même : présenter l'offre par <strong>situation de vie</strong> plutôt que par famille de produits, et garder la vue par produit pour ceux qui savent déjà ce qu'ils cherchent. Ce n'est pas un choix esthétique, c'est une décision d'architecture qui se prend avant la première maquette.</p>

<h2>Qualifier un contact plutôt que le collecter</h2>

<p>Un formulaire « Nom, e-mail, message » vous apporte des demandes que vous devrez qualifier au téléphone, une par une. Pour un cabinet dont le temps est la ressource rare, c'est le mauvais échange.</p>

<p>Quelques questions supplémentaires, posées correctement, changent la nature de ce qui arrive dans votre boîte : la situation, l'échéance, ce qui motive la démarche. Le prospect y répond volontiers — c'est même rassurant, parce que ça ressemble à un premier rendez-vous plutôt qu'à une prise de contact commerciale.</p>

<p>Deux règles pratiques : ne demandez jamais une information que vous n'utiliserez pas, et dites ce qui se passe ensuite. Un formulaire qui annonce la suite est rempli plus souvent qu'un formulaire qui se contente d'un bouton « Envoyer ».</p>

<h2>Ce que le référencement change pour un cabinet</h2>

<p>Un cabinet patrimonial n'a pas besoin de trafic. Il a besoin de <strong>quelques dizaines de bonnes personnes par an</strong>, ce qui est un objectif complètement différent — et beaucoup plus atteignable.</p>

<p>Les requêtes qui amènent un client ne sont presque jamais « gestion de patrimoine ». Ce sont des questions : que faire après la vente de son entreprise, comment préparer une succession, faut-il un CGP quand on n'est pas fortuné. Chacune est une page, et chaque page est une occasion d'être trouvé par quelqu'un qui a déjà le problème que vous savez traiter.</p>

<p>À cela s'ajoute la dimension locale. « Conseiller en gestion de patrimoine » suivi d'un nom de ville est une recherche à très forte intention, et elle se gagne avec des éléments concrets : une adresse réelle, une fiche d'établissement à jour, des pages qui parlent du territoire.</p>

<h2>Par où commencer</h2>

<p>Si vous avez déjà un site, trois questions suffisent à savoir s'il travaille pour vous :</p>

<ul>
  <li>Un visiteur peut-il vérifier votre statut sans aller dans les mentions légales ?</li>
  <li>Peut-il trouver sa propre situation en moins de trente secondes ?</li>
  <li>Sait-il ce qui se passe après avoir rempli le formulaire ?</li>
</ul>

<p>Trois « non » ne veulent pas dire qu'il faut tout refaire. Dans la plupart des cas, l'essentiel se joue sur l'organisation du contenu et sur la hiérarchie des preuves — pas sur le design.</p>

<p>C'est le travail que nous avons mené pour Kanti : structurer une offre patrimoniale complexe, pour aboutir à une expérience plus claire, cohérente et évolutive. Si vous êtes dans la même situation, <a href="/contact">parlez-nous de votre cabinet</a> : on revient avec une lecture du problème avant de parler design.</p>
$article$,
  'https://kov-agency.site/work/kanti-mockup.webp',
  'published',
  now(),
  'Gestion de patrimoine',
  'Septembre 2026',
  '6 min',
  false,
  'Site internet de CGP : ce que vos prospects vérifient | KOV',
  'Immatriculation, méthode, structuration de l''offre : ce qu''un prospect cherche sur le site d''un conseiller en gestion de patrimoine, et dans quel ordre.',
  'KOV',
  null
)
on conflict (slug) do nothing;
