# Game of More — note de passation

Dernière mise à jour : 18 août 2026 (fin de journée).

## 1. Où on en est en une phrase

La refonte graphique est **intégrée dans l'application** : univers
médiéval-fantastique, thème parchemin clair, personnages vectoriels entiers.
Le jeu tourne, les 21 tests passent, aucune règle métier n'a été touchée.

## 2. Décisions de l'utilisateur (fermes)

| Sujet | Décision |
|---|---|
| Fond | **Bleu nuit** (thème « jeu vidéo »). ⚠️ A remplacé le parchemin clair choisi plus tôt : une seconde session Claude a réécrit `styles.css` le 18/08 et l'utilisateur a confirmé qu'on garde le sombre. |
| Technique | SVG vectoriel généré par le code. Pas de pixel art, pas de PNG. |
| Univers | **Aventure, style jeu vidéo.** Moins chevalier que la première passe : la tenue de départ est volontairement simple, ce sont les objets qui donnent le style. |
| Cadrage sur le plateau | **Personnage entier.** Le recadrage buste a été proposé et écarté ; il n'existe plus dans le code. |
| Réalisme | Poussé d'un cran (maille texturée, plis, occlusion, grèves d'acier). L'utilisateur a demandé de **ne pas s'enliser dans le détail** : l'objectif est un design qui fonctionne. |
| Catalogue d'objets | Reporté. Ne pas l'inventer, l'utilisateur le donnera. |
| Palette | Sourdine + accents héraldiques. **Les primaires saturées ont été rejetées** — c'est la sourdine qui produit l'effet « classe » validé. |

## 3. Ce qui a été fait

| Fichier | État |
|---|---|
| `src/avatar.mjs` | **Réécrit.** Chevalier médiéval-fantastique. API publique inchangée (`renderHero`, `renderItemArt`, `renderEmblem`, `renderCoinIcon`, `renderHeartIcon`, `renderMascot`) — `app.mjs` n'a pas eu à bouger. |
| `styles.css` | Thème bleu nuit, **écrit par une autre session** — ne pas y toucher sans vérifier qu'aucune autre session n'est active (`ListAgents`). |
| `index.html` | Polices, `theme-color`, description. |
| `assets/favicon.svg` | Écu + étoile à huit rais. |
| `src/app.mjs`, `src/domain.mjs`, `server/`, `tests/` | **Non touchés.** |

### Traduction du modèle de données vers le vestiaire médiéval

Les identifiants de `domain.mjs` n'ont pas changé ; `avatar.mjs` les traduit en
haut de fichier (`OUTFITS`, `HEADGEAR`, `HANDGEAR`, `HAIRCUTS`) :

- tenues → progression visible : **lin brut** (départ, simple tunique) → **sinople + mantelet de cuir** (rôdeur) → **pourpre + cape + armoiries** (mage) → **écarlate + maille + grèves + cape** (gardien) ;
- `explorer-cap` → capuche · `wizard-hat` → chapeau de mage · `gold-crown` → couronne ;
- `pencil-sword` → épée + fourreau · `word-wand` → bâton à orbe · `star-shield` → écu ;
- `cool` → regard déterminé + cicatrice (l'équivalent médiéval du « cool »).

Renommer un objet dans la boutique = changer une entrée de ces tables, rien d'autre.

## 4. Comment marche le rendu (à lire avant de modifier `src/avatar.mjs`)

Chaque forme est déclarée **une seule fois** comme donnée (`{tag, a, fill}`)
dans `heroShapes()`. `renderFigure()` la sort **deux fois** : remplie pour le
dessin, et géométrie nue dans un `<clipPath>`. Les deux calques d'ombrage
(coin sombre à droite, coin clair à gauche) sont peints par-dessus tout,
découpés par ce clipPath.

Conséquence utile : **tout nouvel accessoire prend la lumière gratuitement**,
il suffit de l'ajouter à la liste des formes. Ne pas peindre d'ombres à la
main, ça casserait cette propriété.

Deux pièges déjà rencontrés :

- **L'ordre de la liste est l'ordre de profondeur.** La capuche a été dessinée
  après la tête pendant un temps : les visages disparaissaient. Tout volume qui
  entoure le crâne se pousse **avant** l'ovale du visage, le bord se pousse après.
- **`id` doit être unique par SVG dans la page**, sinon les `clipPath` et le
  motif de maille se marchent dessus. `renderHero` utilise l'id de l'élève,
  `renderItemArt` un compteur.

Les aperçus boutique sont **la même figure recadrée** (table `ITEM_CROPS`) :
aucune géométrie dupliquée, ce qu'on achète est ce qu'on portera.

## 5. Méthode de travail

L'utilisateur juge **au rendu, pas au code**. Ne pas lui décrire un dessin, le
lui montrer.

- Pas d'extension Chrome connectée. Utiliser **google-chrome headless** :
  `google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars --window-size=L,H --virtual-time-budget=6000 --screenshot=out.png "http://localhost:5180/"`
- Pour tester une app peuplée **sans toucher aux données de l'utilisateur** :
  lancer une seconde instance isolée, `DATA_DIR=/tmp/... PORT=5199 node server/server.mjs`,
  puis `PUT /api/state` avec un état de démonstration.
- ⚠️ **ImageMagick rend mal les SVG avec `transform`** (délégué rsvg absent) et a
  déjà fait croire à un bug inexistant. **Chrome fait foi.**
- ⚠️ `python3 -m http.server` ne renvoie pas de charset → mojibake sur les accents.

## 5 bis. Repères du visage — à respecter pour tout couvre-chef

Crâne 24 · racine des cheveux 36 · **sourcil 45** · œil 52 · nez 62 · bouche 68 ·
menton 79. Oreilles y 49–59. Une version antérieure posait le bandeau du heaume
à y=52 : il passait sur les yeux. **Tout couvre-chef s'arrête au-dessus de 45.**

Les cheveux ont trois états : masse complète (tête nue), **pattes seules** sous
un chapeau — sinon la coiffe flotte sur un volume qu'elle devrait écraser — et
rien du tout sous capuche ou heaume. Les longueurs se poussent *avant* la tête,
les oreilles *après* la coiffure.

## 6. Ce qui reste ouvert

- ⚠️ **Deux sessions Claude ont travaillé en parallèle sur ce dépôt le 18/08** et se sont écrasées sur `styles.css`. Vérifier `ListAgents` avant d'éditer un fichier partagé.
- **Une seule silhouette** pour tout le monde, différenciée par coiffure et
  couvre-chef. Question posée à l'utilisateur, **restée sans réponse** — à reposer
  avant d'investir dans une deuxième.
- **Pose statique et symétrique.** Une pose légèrement décalée gagnerait beaucoup
  mais complique la paramétrisation.
- Les épaules de maille peuvent lire comme des épaulettes à petite taille.
- Le catalogue d'objets par niveau reste à définir (côté utilisateur).
- Les polices viennent de Google Fonts : **hors ligne, la classe retombe sur
  Georgia / system-ui.** Acceptable, mais à héberger en local si l'école coupe le net.

## 7. Historique

`docs/heroes-proposal.html` (4 directions comparées) et
`docs/explorer-direction.html` (l'étape « explorateur », avant le pivot médiéval)
sont conservés pour comprendre pourquoi le vecteur a gagné.
`docs/hero-explorer.mjs` est le module de l'étape explorateur, superseded par
`src/avatar.mjs`.

- v1, les 4 directions : https://claude.ai/code/artifact/ddcf7814-2025-4d6d-a286-0f85fe187a83
- v2, la direction explorateur : https://claude.ai/code/artifact/0e43a95f-1173-440b-9811-804907ac06dc
