-- Un article sur le message "impossible de recuperer le sitemap".
--
-- Requete de panne : quelqu'un la tape avec le probleme sous les yeux. La
-- reponse est donc donnee en tete, et chaque cause porte son propre test,
-- pour que chaque passage tienne debout seul s'il est extrait.
--
-- Aucun tiret cadratin, ni dans l'article ni dans ces commentaires.
--
-- Sur ce qu'il affirme : aucun chiffre, aucun delai promis, aucune
-- affirmation sur le fonctionnement interne de Google au-dela de ce qui est
-- public et observable. Les six causes sont celles qui se verifient soi-meme
-- avec une requete HTTP. Le cas du sitemap valide mais vide est celui
-- rencontre sur ce depot, ou une erreur de requete avalee produisait un
-- sitemap sans article et aucun message nulle part.
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
  'impossible-de-recuperer-le-sitemap',
  'Impossible de récupérer le sitemap : les six causes, et comment les distinguer',
  'Le message de Search Console ne dit pas ce qui ne va pas. Six causes le produisent, et un seul test les départage en trente secondes.',
  $article$
<p>Le message « impossible de récupérer le sitemap » ne dit pas ce qui ne va pas. C'est un constat d'échec, pas un diagnostic, et six causes très différentes le produisent.</p>

<p>Avant d'en modifier une seule, faites le test qui les départage : ouvrez l'adresse de votre sitemap vous-même, depuis une fenêtre de navigation privée, comme un visiteur qui ne serait jamais venu. Ce que vous voyez à cet instant élimine la moitié des hypothèses.</p>

<h2>Cause 1 : l'adresse ne répond pas vraiment 200</h2>

<p>La plus fréquente, et la plus invisible depuis votre poste.</p>

<p>Une redirection compte comme un échec à cet endroit. Si vous avez déclaré votre sitemap sur une adresse qui redirige vers une autre, avec ou sans <em>www</em>, en <em>http</em> plutôt qu'en <em>https</em>, ou vers une version localisée, vous avez déclaré une adresse qui ne sert pas le fichier. Une page d'erreur renvoyée avec un code 200 est le même piège inversé : le serveur dit que tout va bien et envoie du HTML d'excuse.</p>

<p>Le test : l'adresse exacte que vous avez soumise, au caractère près, doit renvoyer le fichier directement, sans étape intermédiaire.</p>

<h2>Cause 2 : le sitemap répond, mais il est vide</h2>

<p>Celle-là ne se voit pas du tout, parce que tout a l'air de fonctionner.</p>

<p>Un sitemap qui liste vos pages fixes mais aucun de vos articles est presque toujours le symptôme d'une erreur avalée. Le code demande la liste des contenus publiés, la requête échoue, personne ne lit le message d'erreur, et le fichier se génère quand même avec ce qu'il restait. Nous avons eu exactement ce cas ici : la seule différence entre un sitemap complet et un sitemap amputé était une erreur que rien n'affichait.</p>

<p>Le test : comptez les adresses dans le fichier, et comparez avec ce que vous publiez réellement. Un écart est un bug, jamais une coïncidence.</p>

<h2>Cause 3 : la propriété déclarée n'est pas celle des adresses</h2>

<p>Search Console vérifie que les adresses contenues dans le sitemap appartiennent bien à la propriété où vous le soumettez.</p>

<p>Si votre propriété est déclarée avec <em>www</em> et que vos adresses n'en ont pas, ou l'inverse, le fichier est refusé même s'il est parfaitement valide. Même chose entre <em>http</em> et <em>https</em>. C'est une cause de rejet fréquente sur les sites qui ont changé de domaine ou forcé le chiffrement après coup.</p>

<p>Le test : ouvrez le fichier et comparez la première adresse listée avec le nom exact de votre propriété. Ils doivent coïncider caractère pour caractère.</p>

<h2>Cause 4 : votre robots.txt bloque ce que vous soumettez</h2>

<p>Deux variantes, avec deux conséquences distinctes.</p>

<p>Soit le chemin du sitemap lui-même est interdit, et il ne peut pas être lu. Soit les adresses qu'il contient sont interdites, et il est lu mais son contenu est inexploitable. Le second cas est le plus déroutant, parce que le fichier se charge très bien quand vous l'ouvrez vous-même.</p>

<p>Profitez-en pour vérifier que votre robots.txt déclare l'adresse de votre sitemap. Ce n'est pas obligatoire, mais c'est la manière la plus simple de la rendre trouvable sans la soumettre nulle part.</p>

<h2>Cause 5 : le sitemap liste des pages que vous demandez d'ignorer</h2>

<p>Un sitemap est une liste de pages que vous voulez voir indexées. Y faire figurer une page marquée en <em>noindex</em> est une contradiction, et elle vous est signalée.</p>

<p>Les coupables habituels sont toujours les mêmes : une page de connexion, une page de remerciement après formulaire, une prévisualisation de brouillon. Elles n'ont rien à faire dans le fichier, précisément parce qu'elles font correctement leur travail ailleurs.</p>

<blockquote>Un sitemap est une liste de pages que vous voulez indexées. Tout ce qui n'est pas dans ce cas n'a rien à y faire.</blockquote>

<h2>Cause 6 : ce n'est pas du XML</h2>

<p>Un sitemap doit commencer par une déclaration XML, et rien ne doit la précéder. Pas une ligne vide, pas un caractère invisible ajouté par un éditeur, pas un avertissement du serveur.</p>

<p>Le test : regardez les tout premiers caractères du fichier. S'ils ne sont pas la déclaration XML, vous avez trouvé. Cette cause se produit surtout quand le sitemap est généré à la main ou par une extension plutôt que par le site lui-même.</p>

<h2>Ce que le message ne veut pas dire</h2>

<p>Il ne veut pas dire que votre site est pénalisé. Il ne veut pas dire non plus que vos pages ne seront pas indexées : un sitemap facilite la découverte, il ne la conditionne pas. Un site correctement lié en interne se fait trouver sans lui.</p>

<p>Cette nuance a son importance, parce qu'elle évite deux erreurs opposées : paniquer sur un message qui n'est pas grave, et croire qu'un sitemap réparé suffit à régler un problème de visibilité. Si vos pages n'ont aucun lien entrant depuis le reste du site, le sitemap ne compensera rien.</p>

<h2>Une fois corrigé</h2>

<p>Soumettez une fois, et laissez faire. Renvoyer le fichier dix fois dans la journée n'apporte rien et vous prive du seul signal utile, qui est de voir l'état changer tout seul.</p>

<p>Profitez de l'attente pour vérifier ce qui compte davantage : que chaque page listée soit réellement atteignable depuis une autre page du site. Une page présente dans le sitemap et liée depuis nulle part est une page orpheline, et le sitemap ne la sauvera pas.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>Le sitemap est souvent innocent. Dans notre propre cas, le fichier était parfaitement valide et le vrai problème était ailleurs : un contenu absent de la base, donc absent du site, donc absent du fichier. Chercher l'erreur dans le sitemap aurait pu durer longtemps.</p>

<p>Commencez donc par regarder le fichier de vos propres yeux, puis remontez la chaîne. C'est le même réflexe que celui décrit dans notre article sur la <a href="/journal/etre-cite-par-chatgpt-et-perplexity">citation par ChatGPT et Perplexity</a> : ce qui compte est ce que la machine reçoit, pas ce que vous croyez lui envoyer. Si vous préférez qu'on regarde avec vous, <a href="/contact">écrivez-nous</a>, et si le sujet est plus large que ce fichier, notre approche du <a href="/expertise/developpement">développement</a> vous dira comment nous le traitons.</p>
$article$,
  null,
  'published',
  now(),
  'Référencement',
  'Septembre 2026',
  '5 min',
  false,
  'Impossible de récupérer le sitemap : les causes | KOV',
  'Six causes produisent ce message de Search Console. Un test unique les départage, et chacune a le sien. Le sitemap est souvent innocent.',
  'KOV',
  null
)
on conflict (slug) do nothing;
