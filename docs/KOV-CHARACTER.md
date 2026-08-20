# KOV — Character

Le personnage KOV est un élément de branding fort. **Il ne doit jamais être traité comme une mascotte.** Il représente le guide de l'univers KOV.

## Design à verrouiller

Toujours conserver, sans redesign d'une scène à l'autre :

- silhouette élancée
- cape / poncho noir asymétrique
- pantalon noir
- gants noirs
- bottines noires
- casque sphérique
- partie supérieure minérale / béton
- grande visière noire brillante
- aucun visage
- petit point rouge
- quelques détails rouges très fins

## Personnalité

Transmet : calme / précision / intelligence / maîtrise / mystère.

**Jamais** : drôle, agressif, militaire, menaçant, cartoon, bavard.

Il communique principalement par **posture + regard du casque + mains** — jamais par dialogue ou expression faciale (il n'a pas de visage).

## Rôle dans le site

Il accompagne l'utilisateur sans être constamment visible, comme fil narratif :

| Scène | Rôle |
|---|---|
| Hero | Il découvre l'utilisateur |
| Entrée dans KOV | Il ouvre l'espace avec ses mains |
| Expertises | Il révèle plusieurs layers |
| Portfolio | Il regarde ou présente un projet |
| Process | Il accompagne légèrement la progression |
| Contact | Dernière apparition, éventuellement de dos |

## Assets

| Fichier | Usage |
|---|---|
| `/kov/character/character-reference-sheet.png` | Feuille de référence du design verrouillé (source pour toute génération) |
| `/kov/character/contact-corridor-scrub.mp4` + `-still.png` | Clip Kling (image-to-video), personnage de dos dans un couloir en béton — utilisé par `/contact` (drag-to-scrub) |
| `/kov/character/login-frames/frame-000.jpg` … `frame-059.jpg` | Séquence de 60 images extraites d'un clip Kling 16:9 (rotation face → profil droit) — utilisée par `/login`, indexée en direct par la position horizontale de la souris (pas de drag, pas de scroll) |

*(2026-08-20 : remplace l'ancien placeholder procédural Three.js de `/login` — voir `src/components/login/LoginCharacterBackdrop.tsx`. Le premier essai en 9:16 laissait trop de vide à l'écran une fois en fond de page ; regénéré en 16:9 avec le personnage centré et dominant le cadre. Aucun modèle Kling n'expose de contrôle d'orbite caméra précis ; le clip est un mouvement de caméra approximatif décrit par prompt, pas un tourniquet 3D exact — la rotation obtenue va d'un cadrage face-caméra à un profil droit complet, pas symétrique gauche/droite.

Extraction : 60 frames au format natif 1916×1080 en JPEG qualité 92 [ffmpeg -q:v 2] — un premier passage réduit à 1600px de large avec une compression plus agressive produisait des artefacts de blocs visibles sur les zones sombres ; ne plus redescendre en dessous de la résolution native pour ce type de scène.

Repositionnement tête/texte : demander à Kling un cadrage précis en pourcentage ("tête à 28% du haut") n'a pas donné de résultat fiable après plusieurs essais (tantôt trop petit, tantôt cadré trop serré). La position finale du personnage dans le cadre est plutôt composée après coup avec `sharp` — chaque frame est réduite puis recomposée sur un nouveau canevas 1916×1080 rempli du même noir pur que l'arrière-plan d'origine (`rgb(0,0,0)`), avec un fondu sur les ~90 derniers pixels du bas pour éviter une coupure nette du reflet au sol. Un `transform: scale()` CSS en direct sur l'image a été essayé en premier mais laissait une ligne visible : le noir de la page (`--kov-black`, `#0a0a0a`) ne correspond pas exactement au noir pur de la vidéo.)*
