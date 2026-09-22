-- Un article sur l'espace client : ce qu'il remplace et ce qu'il impose.
--
-- Seme plutot que tape dans /admin/content, comme les precedents. Une fois
-- insere c'est un article normal, modifiable et supprimable depuis l'admin.
-- Dollar-quoting, donc aucune apostrophe francaise a echapper.
--
-- Aucun tiret cadratin, ni dans l'article ni dans ces commentaires.
--
-- Sur ce qu'il affirme : aucun chiffre, aucun prix, aucun gain de temps
-- chiffre, aucun nom de client. Le portail decrit est celui de ce depot
-- (devis, factures, documents, suivi, demandes, support, equipe, profil, et
-- la signature electronique des devis), donc rien d'invente. Le paragraphe
-- sur les droits enonce un principe de securite reel : masquer un lien n'est
-- pas une permission. Aucun conseil juridique sur la valeur probante d'une
-- signature, le sujet renvoie au prestataire concerne.
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
  'espace-client-site-internet',
  'Espace client : ce que ça remplace, et ce que ça impose',
  'Un espace client ne se juge pas à ce qu''il affiche, mais à ce qu''il fait disparaître : les relances, les pièces jointes perdues et la question « où en est mon projet ».',
  $article$
<p>Un espace client ne se juge pas à ce qu'il affiche. Il se juge à ce qu'il fait disparaître.</p>

<p>Les relances pour un devis envoyé il y a trois semaines. La pièce jointe que le client ne retrouve pas et qu'il faut renvoyer. Le mail qui demande où en est le projet, auquel il faut répondre en allant chercher l'information à trois endroits. Si votre activité produit ce genre de frottement chaque semaine, la question mérite d'être posée. Sinon, elle ne se pose pas.</p>

<h2>Ce que c'est, et ce que ce n'est pas</h2>

<p>Un espace client est une zone du site, accessible après authentification, où chaque client retrouve ce qui le concerne et rien d'autre.</p>

<p>Ce n'est pas un intranet, qui sert vos équipes. Ce n'est pas un CRM, qui sert votre suivi commercial et que le client ne doit jamais voir. Ce n'est pas non plus un dossier partagé : un dossier partagé donne des fichiers, un espace client donne un état. La nuance décide de tout le reste.</p>

<h2>Ce qu'il contient réellement</h2>

<p>Les besoins se ressemblent d'un métier à l'autre, et se rangent en six familles.</p>

<ul>
  <li><strong>Les devis</strong>, consultables et acceptables sans impression.</li>
  <li><strong>Les factures</strong>, avec leur état de paiement, y compris les acomptes.</li>
  <li><strong>Les documents</strong> que vous produisez ou recevez, rangés une fois pour toutes.</li>
  <li><strong>Le suivi</strong> du projet ou de la prestation, qui répond à la question avant qu'elle soit posée.</li>
  <li><strong>Les demandes</strong>, qui remplacent le fil de mails par quelque chose qui a un état et un historique.</li>
  <li><strong>Les interlocuteurs</strong>, pour que le client sache à qui il parle.</li>
</ul>

<p>C'est la composition du nôtre, et nous n'avons rien trouvé d'utile à y ajouter depuis. La tentation est toujours d'en mettre plus. Un espace client vide dans trois de ses six rubriques donne une impression pire que son absence.</p>

<h2>La signature est le point qui change le plus</h2>

<p>Un devis que l'on consulte et que l'on accepte au même endroit supprime une chaîne entière : imprimer, signer, scanner, retrouver le bon fichier, le joindre, espérer qu'il arrive.</p>

<p>Techniquement, ce n'est pas la signature qui est difficile, c'est la traçabilité : savoir qui a signé, quand, et pouvoir le prouver ensuite. C'est une donnée à conserver, pas une case à cocher. Sur la valeur juridique de tel ou tel dispositif, le sujet dépend du cadre applicable à votre activité, et ce n'est pas à un studio de vous répondre.</p>

<blockquote>Un dossier partagé donne des fichiers. Un espace client donne un état.</blockquote>

<h2>Les droits sont la partie qu'on sous-estime</h2>

<p>C'est la section la plus importante de cet article, et celle qui disparaît des discussions parce qu'elle ne se voit pas à l'écran.</p>

<p>Chaque client doit voir ses données et uniquement les siennes. La question n'est pas de savoir si l'interface affiche les bons éléments, elle est de savoir ce qui se passe quand quelqu'un demande une adresse qui ne lui appartient pas. Masquer un lien n'est pas une permission. Une vérification faite au moment de l'affichage protège l'écran, pas la donnée.</p>

<p>La règle à exiger de qui construit votre portail : la restriction doit vivre au niveau des données, pas seulement dans la page. Chaque lecture et chaque écriture vérifient à qui appartient la ligne, indépendamment de ce que l'interface a bien voulu montrer. Posez la question en ces termes, la réponse vous renseignera vite.</p>

<h2>Ce que ça impose de votre côté</h2>

<p>Un espace client n'est pas une fonctionnalité qu'on livre, c'est un engagement qu'on tient. Il suppose que quelqu'un, chez vous, y dépose les documents, met les états à jour et répond aux demandes qui y arrivent.</p>

<p>C'est la raison principale des portails abandonnés, très loin devant les raisons techniques. Un client qui s'y connecte deux fois et n'y trouve rien de nouveau n'y retourne pas, et vous avez dépensé pour créer une déception.</p>

<p>D'où une conséquence pratique : votre propre back-office compte autant que l'espace client. Si déposer une facture vous demande huit clics, personne ne le fera. La partie visible est celle qu'on vous montre, la partie qui décide du succès est l'autre.</p>

<h2>Quand ça n'en vaut pas la peine</h2>

<p>Si votre relation client est une transaction unique, sans suite et sans documents, un espace client ajoute une inscription entre le client et ce qu'il veut. Si vous avez très peu de clients et que vous les voyez souvent, le mail suffit et il est plus rapide. Si vos échanges ne produisent aucun document récurrent, il n'y a rien à ranger.</p>

<p>Le bon signal est inverse : un espace client se justifie quand la même information est demandée plusieurs fois, par plusieurs personnes, à plusieurs moments.</p>

<h2>Par où commencer</h2>

<p>Pas par la liste complète. Par le document que vos clients réclament le plus souvent.</p>

<p>Dans la plupart des cas c'est la facture, parfois le devis, parfois l'avancement. Mettez celui-là en ligne, correctement, avec ses droits et son historique. Vous saurez au bout d'un mois si vos clients s'y connectent, et cette réponse vaut mieux que n'importe quelle projection faite avant de construire.</p>

<p>Ensuite seulement, ajoutez. Un espace client réussi grandit par ce que les gens y cherchent, pas par ce qu'on avait imaginé qu'ils y chercheraient.</p>

<h2>Ce qu'il faut en retenir</h2>

<p>Un espace client transforme un site qui présente en système qui travaille. Il supprime du frottement réel, à trois conditions : que les droits soient appliqués sur la donnée et pas sur l'écran, que quelqu'un le tienne à jour, et qu'il commence petit sur un besoin vérifié.</p>

<p>C'est ce que recouvrent les <a href="/expertise/systemes">systèmes</a> et l'<a href="/expertise/integration">intégration</a> dans notre façon de travailler, et vous en verrez la logique dans nos <a href="/projets">réalisations</a>. Si vous hésitez entre un site qui présente et un site qui travaille, <a href="/contact">dites-nous ce qui vous fait perdre du temps aujourd'hui</a> : c'est la bonne porte d'entrée, bien plus que la liste des fonctionnalités.</p>
$article$,
  null,
  'published',
  now(),
  'Espace client',
  'Septembre 2026',
  '5 min',
  false,
  'Espace client sur un site : ce que ça change | KOV',
  'Devis, factures, suivi, demandes : ce qu''un espace client remplace vraiment, pourquoi les droits sont le vrai sujet, et quand il ne vaut pas la peine.',
  'KOV',
  null
)
on conflict (slug) do nothing;
