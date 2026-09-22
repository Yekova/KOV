-- Un article sur la visite virtuelle et les espaces immersifs.
--
-- Deliberement complementaire de l'article WebGL et non redondant : celui-ci
-- traite la decision et la conception du parcours, les contraintes techniques
-- restent la-bas et y sont renvoyees par un lien.
--
-- Aucun tiret cadratin, ni dans l'article ni dans ces commentaires.
--
-- Sur ce qu'il affirme : aucun chiffre, aucun prix, aucun taux, aucun nom de
-- client. Les lecons de conception decrites (le cadrage du point d'arrivee,
-- la sortie toujours disponible) viennent de la construction du studio
-- virtuel de ce site. Le nombre de salles n'est jamais cite, parce qu'il
-- changera et qu'un article qui se perime en silence est ce que nous
-- reprochons ailleurs.
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
  'visite-virtuelle-site-internet',
  'Visite virtuelle : ce qu''elle remplace, et ce qu''elle ne remplace pas',
  'Trois techniques très différentes portent le même nom, et le plus grand risque n''est pas la qualité des images : c''est que le visiteur se perde.',
  $article$
<p>Une visite virtuelle ne se juge pas à la qualité de ses images. Elle se juge à ce qu'elle remplace.</p>

<p>Un déplacement que le visiteur n'aura plus à faire. Un appel pour demander à quoi ressemble la salle. Une série de photos qui ne dit jamais comment les pièces s'enchaînent. Si elle ne remplace rien, ce n'est pas une visite virtuelle, c'est un décor, ce qui reste un objectif valable mais ne se défend ni de la même façon ni au même budget.</p>

<h2>Trois techniques portent le même nom</h2>

<p>C'est la première source de malentendu dans les devis, parce que les trois s'appellent « visite virtuelle » et n'ont ni le même coût, ni les mêmes possibilités, ni la même façon de vieillir.</p>

<ul>
  <li><strong>Les panoramiques assemblés.</strong> On photographie depuis quelques points fixes, on relie ces points entre eux. Le visiteur se téléporte d'un point à l'autre et regarde autour de lui. C'est le plus simple, le plus rapide, et c'est souvent suffisant.</li>
  <li><strong>Le relevé du lieu réel.</strong> Un appareil capture la géométrie en plus des images, ce qui permet de se déplacer plus librement et de mesurer. Plus coûteux, et il faut que le lieu existe déjà et soit accessible.</li>
  <li><strong>L'espace reconstruit en 3D.</strong> Rien n'est photographié, tout est modélisé. C'est le seul moyen de montrer un lieu qui n'existe pas encore, ou d'en changer la lumière, les matériaux, l'aménagement. C'est aussi, de loin, le plus exigeant.</li>
</ul>

<p>Choisir sans savoir laquelle des trois on achète est la meilleure façon d'être déçu. Un promoteur qui vend sur plan n'a pas le choix, il lui faut la troisième. Un hôtel qui montre ses chambres n'a presque jamais besoin d'aller plus loin que la première.</p>

<h2>Le vrai risque n'est pas la qualité, c'est de se perdre</h2>

<p>Une visite virtuelle échoue rarement parce que les images sont mauvaises. Elle échoue parce que le visiteur ne sait plus où il est, ne trouve pas comment avancer, et ferme l'onglet.</p>

<p>Un lieu réel donne en permanence des repères que personne ne remarque : la lumière du dehors, le bruit, le sens de la marche, la vue d'ensemble prise en entrant. Une visite virtuelle les supprime tous. Il faut donc les remplacer explicitement, et c'est là que se joue la différence entre une belle production et une production utile.</p>

<h2>Le point d'arrivée décide de tout</h2>

<p>C'est la leçon la plus concrète que nous ayons tirée de la construction de notre propre <a href="/studio">studio virtuel</a>, et elle a demandé plusieurs corrections.</p>

<p>Là où le visiteur arrive, et surtout ce qu'il regarde en arrivant, détermine s'il comprend l'espace ou s'il le subit. Arriver face à un mur, ou dos à l'entrée, suffit à donner l'impression d'un bug alors que tout fonctionne. Arriver face à un élément reconnaissable, une réception, une enseigne, une perspective qui montre où mènent les portes, règle le problème sans une ligne d'explication.</p>

<p>Ce cadrage se décide au degré près, et il se vérifie à l'œil, pas sur un plan. C'est un travail de mise en scène, pas de technique.</p>

<blockquote>Une visite virtuelle supprime tous les repères qu'un lieu réel donne sans qu'on y pense. Il faut les remettre un par un.</blockquote>

<h2>Ce que le visiteur doit pouvoir faire à tout instant</h2>

<p>Trois choses, et elles ne sont pas négociables.</p>

<ul>
  <li><strong>Savoir où il est.</strong> Un nom de pièce affiché, un plan réduit, n'importe quoi qui réponde à la question sans qu'il ait à la poser.</li>
  <li><strong>Revenir en arrière.</strong> Un parcours immersif qui piège le bouton retour du navigateur est vécu comme une agression, et c'est une des rares fautes qui font fermer l'onglet immédiatement.</li>
  <li><strong>Sortir.</strong> Vers une page normale, avec du texte, un contact, un bouton. La visite est un moment du site, pas une impasse.</li>
</ul>

<p>Ajoutez le clavier. Si l'on ne peut se déplacer qu'à la souris, une partie des visiteurs reste sur le seuil.</p>

<h2>Ce qui est vu ne compte pas comme du contenu</h2>

<p>Le texte affiché à l'intérieur d'une scène immersive n'existe pas pour un moteur de recherche : il est dessiné, pas écrit. Une visite virtuelle n'apporte donc aucune visibilité par elle-même, et peut même en retirer si elle remplace des pages qui, elles, étaient lisibles.</p>

<p>La règle est la même que pour toute expérience en 3D : ce qui doit être trouvé doit exister ailleurs, en texte. Le détail des contraintes est dans notre article sur la <a href="/journal/webgl-three-js-3d-temps-reel-navigateur">3D temps réel dans un navigateur</a>.</p>

<h2>Le coût qu'on oublie est la mise à jour</h2>

<p>Un lieu change. On repeint, on réaménage, on change l'enseigne, on ajoute une salle. La visite, elle, reste dans l'état où elle a été produite.</p>

<p>Une visite virtuelle qui ne correspond plus au lieu est pire qu'aucune visite, parce qu'elle crée une attente que la réalité dément. Posez donc la question du renouvellement avant de commander, pas deux ans plus tard : qui reprend les prises de vue, à quelle occasion, et est-ce prévu.</p>

<p>C'est souvent ce qui doit faire pencher vers la technique la plus simple. Des panoramiques se refont ; un espace entièrement modélisé se remodélise.</p>

<h2>Quand une bonne série de photos suffit</h2>

<p>Si votre lieu tient en deux pièces, si vos visiteurs viennent de toute façon sur place avant de décider, ou si ce qu'ils veulent voir est un détail plutôt qu'un volume, une série de photographies bien faites est plus rapide à consulter et moins coûteuse à maintenir.</p>

<p>La visite virtuelle gagne quand l'enjeu est la circulation : comprendre comment les espaces s'articulent, mesurer une distance, se projeter dans un déplacement. Elle perd quand l'enjeu est la matière ou le détail, qu'une photo rend mieux.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>Commencez par la question du remplacement, choisissez ensuite laquelle des trois techniques vous achetez, puis consacrez l'essentiel de l'attention au parcours plutôt qu'aux images. Un visiteur qui sait où il est, qui peut revenir et qui peut sortir pardonnera beaucoup à la qualité. L'inverse n'est pas vrai.</p>

<p>Vous pouvez parcourir le nôtre depuis la page <a href="/studio">studio</a>, et voir comment il s'inscrit dans nos <a href="/projets">réalisations</a>. Le travail de mise en mouvement est décrit dans notre approche du <a href="/expertise/motion">motion</a>. Si vous vous demandez si votre lieu gagnerait à être parcouru plutôt que photographié, <a href="/contact">dites-nous ce que vos visiteurs cherchent à voir</a> : la réponse en découle presque toujours.</p>
$article$,
  null,
  'published',
  now(),
  'Immersif',
  'Septembre 2026',
  '5 min',
  false,
  'Visite virtuelle sur un site : ce que ça remplace | KOV',
  'Trois techniques portent ce nom et ne coûtent pas la même chose. Le vrai risque n''est pas la qualité des images, c''est que le visiteur se perde.',
  'KOV',
  null
)
on conflict (slug) do nothing;
