-- Un article sur la 3D temps reel dans le navigateur (WebGL, Three.js, shaders).
--
-- Seme plutot que tape dans /admin/content, comme les deux precedents : c'est
-- du HTML long, et un copier-coller dans un editeur est la meilleure facon de
-- perdre un paragraphe en route. Une fois insere c'est un article normal,
-- modifiable et supprimable depuis l'admin. Dollar-quoting, donc aucune
-- apostrophe francaise a echapper dans le corps.
--
-- Aucun tiret cadratin, ni dans l'article ni dans ces commentaires.
--
-- Sur ce qu'il affirme. Un seul chiffre y figure, 259 mots, et il est mesure
-- sur notre propre page /studio plutot qu'avance sur un tiers. Il est date
-- dans le texte ("au moment ou nous ecrivons") parce qu'il cessera d'etre
-- vrai le jour ou cette page sera etoffee, et qu'un article qui se perime en
-- silence est exactement ce que le precedent denonce. Aucune performance,
-- aucun taux de conversion, aucun cout : rien de tout cela n'est mesurable
-- ici. Les deux pieges techniques decrits sont ceux rencontres dans ce
-- depot ; FluidGlassCursor n'est pas cite, il a ete supprime depuis.
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
  'webgl-three-js-3d-temps-reel-navigateur',
  'WebGL et 3D temps réel : ce qu''une expérience immersive impose à votre site',
  'Une scène 3D qui tourne dans un navigateur n''est plus une prouesse. Ce qu''elle impose au reste du site, en revanche, est rarement annoncé.',
  $article$
<p>Une scène 3D qui tourne dans un navigateur, sans plugin et sans installation, n'est plus une prouesse. C'est devenu une option parmi d'autres au moment de concevoir un site. La vraie question n'est donc plus « est-ce possible », mais « qu'est-ce que ça impose au reste du site ».</p>

<p>Ça impose beaucoup, et rarement là où on l'attend.</p>

<h2>WebGL, Three.js, shaders : qui fait quoi</h2>

<p>Les trois mots circulent ensemble et ne désignent pas la même chose.</p>

<ul>
  <li><strong>WebGL</strong> est l'interface qui permet à une page web de parler à la carte graphique. C'est le socle, intégré aux navigateurs depuis des années : rien à installer côté visiteur.</li>
  <li><strong>Three.js</strong> est une bibliothèque posée dessus. Elle fournit les notions qu'on manipule réellement : une caméra, des lumières, des matériaux, des objets. Écrire une scène directement en WebGL reste possible, mais personne ne s'y résout sans motif précis.</li>
  <li>Un <strong>shader</strong> est un petit programme exécuté par la carte graphique elle-même, pour chaque pixel ou presque. C'est lui qui produit une matière, une déformation, une lumière qu'aucune image fixe ne saurait rendre.</li>
</ul>

<p>La hiérarchie tient en une phrase : WebGL est la porte, Three.js est l'outillage, les shaders sont l'endroit où se joue l'essentiel de ce qui se voit.</p>

<h2>La question à trancher avant la technique</h2>

<p>Est-ce que la 3D porte une information, ou est-ce qu'elle décore ?</p>

<p>Les deux réponses sont légitimes, elles n'engagent simplement pas le même projet. Un configurateur qui laisse voir un produit sous l'angle qu'on choisit porte une information : il remplace une question posée à un commercial. La visite d'un lieu remplace un déplacement. Une matière animée en fond de page ne remplace rien, elle installe une atmosphère, ce qui est un objectif valable mais qui ne se défend ni de la même manière ni au même budget.</p>

<p>Le piège consiste à financer le premier en croyant acheter le second, ou l'inverse. Tranchez avant d'ouvrir le sujet technique, pas après.</p>

<h2>Le mur principal : un canvas ne contient aucun texte</h2>

<p>C'est la contrainte que presque personne n'annonce, et c'est la plus lourde pour votre visibilité.</p>

<p>Une scène WebGL vit dans une balise <em>canvas</em>. Pour un moteur de recherche, pour un lecteur d'écran, pour un moteur de réponse, cette balise est vide. Le texte affiché dans votre scène, aussi lisible soit-il à l'œil, n'existe pas pour eux : il est dessiné, pas écrit.</p>

<p>Nous en faisons nous-mêmes les frais. Notre <a href="/studio">studio virtuel</a> est la page la plus travaillée du site et la moins lisible par une machine : au moment où nous écrivons, la page entière rend environ 259 mots, navigation et pied de page compris. L'expérience est là, le texte n'y est pas.</p>

<blockquote>Une scène 3D est vue par vos visiteurs et ignorée par tout le reste. Ce qui doit être trouvé doit exister ailleurs, en texte.</blockquote>

<p>La règle qui en découle est simple : la couche immersive ne doit jamais être le seul endroit où vit l'information. Le même contenu doit exister en HTML, quelque part, sous une forme lisible. C'est l'exigence décrite dans notre article sur la <a href="/journal/etre-cite-par-chatgpt-et-perplexity">citation par ChatGPT et Perplexity</a>, poussée à son cas extrême.</p>

<h2>Le poids se paie au premier chargement</h2>

<p>Une scène doit être arrivée avant de pouvoir tourner. Géométries, textures, bibliothèque : tout cela se télécharge, et se télécharge avant que le visiteur ne voie quoi que ce soit si personne n'a décidé du contraire.</p>

<p>Les décisions qui comptent sont donc des décisions de chargement. Ne pas placer la 3D dans le chemin critique du premier affichage. Ne la déclencher que lorsqu'elle approche de l'écran. Compresser les textures, qui pèsent presque toujours plus que la géométrie. Et accepter de retirer de la scène ce qui ne se voit pas : un décor n'a pas besoin d'être modélisé pour être crédible.</p>

<h2>Il n'existe pas de fréquence d'images garantie</h2>

<p>Le même site tourne sur un poste de travail récent et sur un téléphone de trois ans, avec un écart de puissance que rien ne compense. Ajoutez la chauffe : un mobile qui chauffe réduit lui-même sa puissance pour se protéger, donc une scène fluide à la première minute peut ne plus l'être à la troisième.</p>

<p>Une expérience 3D se conçoit donc avec sa dégradation, pas seulement avec son état nominal. Une image fixe de qualité, affichée à la place de la scène quand la machine ne suit pas, est un résultat acceptable. Une scène qui saccade n'en est pas un.</p>

<h2>Accessibilité et confort ne sont pas optionnels</h2>

<p>Une navigation à la première personne peut donner la nausée, et ce n'est pas une façon de parler : caméra imposée, champ de vision étroit, accélérations subies. Le système d'exploitation expose un réglage de réduction des animations, que le navigateur transmet à la page. Une expérience sérieuse le lit et propose autre chose : pas une version appauvrie, un parcours équivalent.</p>

<p>Ajoutez le clavier. Si l'on ne peut avancer qu'à la souris, une partie de vos visiteurs reste dehors.</p>

<h2>Ce qui casse, et qu'on ne voit pas venir</h2>

<p>Deux exemples concrets, parce que ce sont eux qui font déraper les plannings et qu'ils ne figurent dans aucun devis.</p>

<p><strong>Le contexte graphique se perd, et il ne revient pas tout seul.</strong> En développement, React monte un composant, le démonte et le remonte aussitôt pour débusquer les effets mal nettoyés. Si ce nettoyage libère le contexte graphique d'un canvas que React conserve, le remontage en redemande un et récupère celui qui vient d'être tué. Tout s'exécute ensuite dans le vide, sans la moindre erreur affichée. Nos composants WebGL créent pour cette raison leur propre canvas et le détruisent avec le contexte, plutôt que de le confier au rendu.</p>

<p><strong>Certains réglages du moteur de rendu sont globaux.</strong> Une couleur de fond posée pour un rendu intermédiaire reste posée pour le rendu suivant. Le symptôme est spectaculaire, un bloc opaque qui recouvre la page, et la cause tient en une ligne oubliée. Ce genre de défaut ne se trouve pas en relisant le code, il se trouve en isolant.</p>

<p>Ce ne sont pas des anecdotes, c'est le coût réel de la 3D temps réel : pas la beauté de la scène, mais le temps passé sur des comportements que rien n'annonce.</p>

<h2>Quand il vaut mieux s'abstenir</h2>

<p>Si votre contenu est un catalogue à parcourir vite, la 3D ajoute de l'attente avant l'information. Si votre audience consulte surtout depuis des appareils modestes, vous concevez pour une minorité. Et si personne, chez vous ou chez votre prestataire, ne reprendra ce code dans deux ans, vous achetez une page qui vieillira sans pouvoir être réparée. Une scène 3D est du code, et le code demande de l'entretien.</p>

<p>Le bon usage est presque toujours local : un moment, une page, une démonstration. Rarement le site entier.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>La 3D temps réel dans un navigateur est mûre, accessible, et parfaitement capable de porter un projet. Elle impose trois choses en retour : que l'information existe aussi en texte, que le chargement soit décidé plutôt que subi, et que la dégradation soit conçue au même titre que l'effet.</p>

<p>C'est ce que recouvrent le <a href="/expertise/motion">motion</a> et le <a href="/expertise/developpement">développement</a> dans notre façon de travailler, et ce que vous pouvez parcourir directement dans nos <a href="/projets">réalisations</a>. Si vous vous demandez si votre projet justifie ce niveau d'engagement, <a href="/contact">écrivez-nous</a> : la réponse est parfois non, et c'est une réponse utile.</p>
$article$,
  null,
  'published',
  now(),
  'WebGL',
  'Septembre 2026',
  '6 min',
  false,
  'WebGL et 3D temps réel dans le navigateur | KOV',
  'WebGL, Three.js, shaders : ce que la 3D temps réel apporte à un site, ce qu''elle coûte en chargement et en visibilité, et quand il vaut mieux s''abstenir.',
  'KOV',
  null
)
on conflict (slug) do nothing;
