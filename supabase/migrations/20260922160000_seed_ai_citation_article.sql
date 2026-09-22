-- Un article sur la citation par les moteurs de réponse (ChatGPT, Perplexity).
--
-- Semé plutôt que tapé dans /admin/content, pour la même raison que l'article
-- CGP : c'est du HTML long, et un copier-coller dans un éditeur est la
-- meilleure façon de perdre un paragraphe en route. Une fois inséré c'est un
-- article normal — modifiable, dépubliable, supprimable depuis l'admin comme
-- n'importe quel autre. Dollar-quoting, donc pas une apostrophe française à
-- échapper dans le corps.
--
-- Sur ce qu'il affirme : aucun chiffre, aucune promesse de résultat, aucune
-- statistique. Le sujet en attire beaucoup et elles sont presque toutes
-- invérifiables. Ce qui est affirmé ici est soit observable par le lecteur
-- lui-même (le test du code source), soit documenté publiquement par les
-- opérateurs (les noms d'agents) — et l'article dit explicitement d'aller
-- vérifier cette liste à la source plutôt que de le croire sur parole. Le
-- statut de llms.txt est décrit comme ce qu'il est : une convention que
-- personne ne s'est engagé à lire.
--
-- cover_image_path reste null : aucun visuel du dépôt ne correspond au sujet,
-- et mettre la maquette d'un client sur un article qui ne parle pas de lui
-- serait faux. La couverture se choisit depuis l'admin.
--
-- on conflict do nothing : rejouer les migrations ne doit ni dupliquer
-- l'article, ni écraser une version que le propriétaire aurait éditée depuis.

insert into posts (
  slug, title, excerpt, body, cover_image_path, status, published_at,
  tag, date_label, reading_time, featured,
  meta_title, meta_description, author_name, client_display_name
) values (
  'etre-cite-par-chatgpt-et-perplexity',
  'Être cité par ChatGPT et Perplexity : ce que ça demande à votre site',
  'Les moteurs de réponse ne classent pas des pages, ils citent des passages. Ce qui se joue avant la réponse est mécanique bien plus qu''éditorial.',
  $article$
<p>Posez une question à ChatGPT ou à Perplexity : la réponse arrive avec trois ou quatre sources en dessous. Être l'une d'elles n'a plus grand-chose à voir avec être troisième sur Google. Il n'y a pas de deuxième page, pas de liste de dix résultats à parcourir, et souvent aucun clic.</p>

<p>La question n'est donc plus « comment me classer », mais « comment devenir une des sources que la machine reprend ». Ce n'est pas la même mécanique, et la plupart des sites échouent bien avant d'arriver à la partie éditoriale.</p>

<h2>Ce n'est pas un nouveau référencement</h2>

<p>Les moteurs de réponse n'explorent pas un web parallèle. Ils lisent les mêmes pages, par le même protocole, avec des robots qui se déclarent. Rien de ce que vous faites pour eux n'est perdu pour Google, et l'inverse est vrai aussi.</p>

<p>Ce qui change, c'est l'unité. Google indexe une page et la classe. Un moteur de réponse <strong>extrait un passage et l'attribue</strong>. Vous n'optimisez plus une page : vous produisez des passages qui survivent à l'extraction, lisibles seuls, sortis de leur contexte, sans le paragraphe qui les précédait.</p>

<h2>Première condition : que la page existe sans JavaScript</h2>

<p>Celle-là est purement mécanique, et c'est là que tombent beaucoup de sites récents. Un robot qui n'exécute pas votre JavaScript ne voit que le HTML renvoyé par le serveur. Si votre contenu est chargé après coup par le navigateur, il n'existe pas pour lui.</p>

<p>Le test tient en dix secondes et ne demande aucun outil : affichez le code source de la page (Ctrl+U), cherchez une phrase de votre texte. Si elle n'y est pas, aucun moteur de réponse ne la citera, quelle qu'en soit la qualité.</p>

<p>C'est une décision d'architecture, prise au moment du développement, et non un réglage qu'on ajoute après. Un site rendu côté serveur passe ce test par construction ; un site entièrement rendu côté navigateur ne le passe jamais.</p>

<h2>Deuxième condition : une autorisation, et elle est mal comprise</h2>

<p>Les robots se déclarent, et ils ne font pas tous le même travail. Côté OpenAI, on distingue notamment :</p>

<ul>
  <li><strong>GPTBot</strong> : collecte destinée à l'entraînement des modèles.</li>
  <li><strong>OAI-SearchBot</strong> : constitution de l'index de recherche.</li>
  <li><strong>ChatGPT-User</strong> : récupération d'une page déclenchée par la question d'un utilisateur.</li>
</ul>

<p>Perplexity déclare de son côté <strong>PerplexityBot</strong> et <strong>Perplexity-User</strong>, sur une logique comparable.</p>

<p>D'où le malentendu le plus répandu : beaucoup de sites bloquent GPTBot en pensant « se protéger de l'IA », puis s'étonnent de n'être jamais cités. Ce sont deux décisions distinctes. Refuser que vos pages nourrissent l'entraînement d'un modèle ne vous retire pas des réponses ; bloquer les agents de recherche et de récupération, si. Tranchez-les séparément, en sachant laquelle vous tranchez.</p>

<p>Cette liste évolue : les opérateurs ajoutent et renomment leurs agents. Avant d'écrire une règle dans votre <em>robots.txt</em>, allez lire la documentation de l'opérateur concerné plutôt qu'un article, celui-ci compris.</p>

<blockquote>Un moteur de réponse ne cite pas un site. Il cite un passage. Écrivez des passages qui tiennent debout tout seuls.</blockquote>

<h2>Troisième condition : écrire des réponses, pas des pages</h2>

<p>Une page qui traite huit sujets ne donne à extraire que du contexte. Une page qui traite une question donne une réponse.</p>

<p>Trois habitudes concrètes, dont aucune n'est technique :</p>

<ul>
  <li><strong>Une question par page</strong>, et un titre qui est cette question.</li>
  <li><strong>La réponse dans le premier paragraphe</strong>, pas après six cents mots de mise en contexte. Le contexte vient ensuite, pour qui reste.</li>
  <li><strong>Aucun renvoi interne implicite</strong> : « comme on l'a vu plus haut » ne veut rien dire dans un passage cité, qui n'a pas de plus haut.</li>
</ul>

<p>C'est exactement pour ça qu'une <a href="/faq">FAQ bien tenue</a> fonctionne : c'est structurellement une collection de réponses autonomes. Et c'est le principe qui a guidé notre article sur les <a href="/journal/site-internet-conseiller-gestion-patrimoine">sites de conseillers en gestion de patrimoine</a> : une question, posée en titre, traitée jusqu'au bout.</p>

<h2>llms.txt : utile, mais pas magique</h2>

<p>C'est un fichier texte placé à la racine du site, qui décrit en clair ce qu'est le site et liste ses pages importantes. Le nôtre est à <em>/llms.txt</em>, et il coûte dix minutes à écrire.</p>

<p>Ce qu'il n'est pas : un standard qu'un grand moteur se serait engagé à lire. Aucun opérateur majeur n'a annoncé s'en servir comme signal. Le coût est proche de zéro, l'attente devrait l'être aussi. Sa vraie valeur est ailleurs : écrire en dix lignes ce qu'est votre site est un exercice qui révèle très vite si vous le savez.</p>

<p>Avec un piège que nous venons de rencontrer chez nous : ce genre de fichier pourrit. Le nôtre annonçait encore qu'une page avait été retirée, alors qu'elle est revenue depuis. Une description qui contredit le site est pire que pas de description du tout. Si vous en tenez un, relisez-le à chaque refonte.</p>

<h2>Ce qui ne marche pas</h2>

<p>Placer le mot « ChatGPT » partout dans vos pages ne vous fera pas citer par ChatGPT. C'est le bourrage de mots-clés dans sa version de l'année, et il vieillira aussi bien que la précédente.</p>

<p>Inventer des chiffres pour paraître autoritaire est pire. Un moteur de réponse recoupe ses sources : un chiffre que personne d'autre n'avance fait de vous l'intrus, et une source contredite est une source qu'on cesse de reprendre. La rigueur n'est pas une posture morale ici, c'est une condition de survie.</p>

<p>Publier beaucoup sans avoir rien à dire, enfin, produit exactement ce qu'on y a mis.</p>

<h2>Comment savoir si ça fonctionne</h2>

<p>Il n'y a pas de tableau de bord, pas de position à relever. Deux méthodes honnêtes, et leurs limites :</p>

<p><strong>Poser les questions vous-même.</strong> Interrogez les moteurs sur les sujets dont vous devriez être la réponse. Mais les réponses varient selon l'utilisateur, la session et le moment : traitez ça comme une observation répétée dans le temps, jamais comme une mesure.</p>

<p><strong>Lire vos journaux serveur.</strong> Les agents s'identifient. Voir OAI-SearchBot ou PerplexityBot venir chercher vos pages vous dit que vous êtes lisible et autorisé, c'est-à-dire la partie que vous maîtrisez réellement.</p>

<p>Le reste, être choisi plutôt qu'un autre, ne se pilote pas. Autant le savoir avant d'y consacrer un budget.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>Tout ce qui précède découle d'une seule chose : un site lisible par une machine et écrit pour être cité. Du HTML servi par le serveur, des autorisations décidées plutôt que subies, des réponses autonomes plutôt que des pages fourre-tout.</p>

<p>Ce n'est pas une nouvelle discipline. C'est l'ancienne, faite correctement, et c'est ce que recouvrent la <a href="/expertise/strategie">stratégie</a> et le <a href="/expertise/developpement">développement</a> dans notre façon de travailler. Si vous voulez savoir ce que votre site donne à lire aujourd'hui, <a href="/contact">écrivez-nous</a> : on regarde, et on vous le dit.</p>
$article$,
  null,
  'published',
  now(),
  'Référencement',
  'Septembre 2026',
  '6 min',
  false,
  'Être cité par ChatGPT et Perplexity | KOV',
  'Moteurs de réponse : pourquoi bloquer GPTBot ne vous protège pas, ce que llms.txt fait vraiment, et comment écrire des passages citables.',
  'KOV',
  null
)
on conflict (slug) do nothing;
