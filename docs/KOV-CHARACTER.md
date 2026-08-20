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
| `/kov/character/login-scrub.mp4` + `-still.png` | Clip Kling distinct, personnage trois-quarts avec un filet de lumière rouge — utilisé par `/login` (drag-to-scrub) |

*(2026-08-20 : remplace l'ancien placeholder procédural Three.js de `/login` — voir `src/components/ui/ScrubVideo.tsx`. Aucun modèle Kling n'expose de contrôle d'orbite caméra précis ; les deux clips sont un mouvement de caméra approximatif décrit par prompt, pas un tourniquet 3D exact.)*
