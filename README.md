# Game of More

Premier draft d'application web pour ludifier les cours d'anglais avec des personnages d'élèves, XP, niveaux, HP, skins et récompenses.

## Lancer (développement local)

```bash
python3 -m http.server 5173
```

Puis ouvrir :

```text
http://localhost:5173
```

Sans backend, l'application sauvegarde dans le `localStorage` du navigateur.

## Production (sauvegarde partagée)

L'application est aussi servie par un petit backend Node (`server/server.mjs`)
qui stocke l'état dans un fichier JSON sur le serveur, avec sauvegardes
horodatées. N'importe quelle machine qui ouvre l'URL retrouve les données.

Voir `BACKEND.md` pour l'architecture, le déploiement sur cagipi et l'API.

## Tester

```bash
npm test
```

## Documentation

Le cadrage du draft est dans `docs/PRODUCT_DRAFT.md`.
