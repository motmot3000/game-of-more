# Game of More — Backend

Le backend de **Game of More** permet de sauvegarder les données des élèves
(classes, XP, niveaux, HP, skins, money…) **sur le serveur** plutôt que dans le
`localStorage` d'un seul navigateur. Résultat : n'importe quelle machine qui
ouvre l'URL retrouve exactement les données laissées précédemment.

## Architecture

```
navigateur (n'importe quelle machine)
        │
        ▼  https://cagipi.taild0ddf5.ts.net/game-of-more
   Tailscale Funnel (HTTPS public, terminaison TLS par Tailscale)
        │  proxy /game-of-more → 127.0.0.1:5180
        ▼
server/server.mjs  (Node, sans dépendances, ~/services/game-of-more/)
        │  sert aussi les fichiers statiques (index.html, styles.css, src/, assets/)
        ▼
data/state.json            ← l'état complet du jeu (JSON)
data/backups/              ← sauvegardes horodatées (rotation : 60 max)
```

> **Sous-chemin et barre oblique finale.** Le Funnel monte l'app sur
> `/game-of-more` et retire ce préfixe avant de transmettre la requête à Node :
> le serveur ne peut donc pas savoir sous quel préfixe il est servi. Or les URLs
> relatives (`./styles.css`, `./src/app.mjs`, `api/state`) ne se résolvent
> correctement que si le chemin se termine par `/`. Sans elle, tout tombait en
> 404 et la page restait blanche. `index.html` contient donc un court script en
> tête de `<head>` qui rétablit la barre oblique. C'est volontairement
> indépendant du préfixe : ça marchera aussi tel quel sous un domaine dédié,
> où l'app est servie à la racine.

> Le nom de domaine final `game-of-more.lecagibi.ch` sera publié par
> l'enseignant ; il pourra être raccroché au même backend soit par un CNAME
> vers l'URL Funnel ci-dessus, soit par un bloc nginx `server_name
> game-of-more.lecagibi.ch` en `proxy_pass` vers `127.0.0.1:5180` (voir plus bas).

## API

| Méthode | Route          | Rôle                                    |
|---------|----------------|------------------------------------------|
| GET     | `/api/health`  | Vérifie que le serveur tourne            |
| GET     | `/api/state`   | Lit l'état sauvegardé (404 si aucun)     |
| PUT     | `/api/state`   | Écrase l'état complet (corps = JSON)     |

L'état est écrit de façon **atomique** (fichier temporaire puis `rename`) et une
**sauvegarde horodatée** de l'état précédent est conservée avant chaque
écrasement, pour pouvoir revenir en arrière en cas d'erreur.

## Côté client

- Au chargement, l'app lit le `localStorage` (affichage immédiat) puis fait un
  `GET /api/state` : si le serveur a une copie plus récente, elle devient
  autoritaire et remplace l'affichage.
- À chaque modification, l'app fait un `PUT /api/state` (debounce de 300 ms).
- `localStorage` reste utilisé comme **cache hors-ligne** : si le serveur est
  injoignable, l'app continue de fonctionner et resynchronisera au prochain
  accès en ligne.

## Déploiement sur cagipi (KJPy)

Le serveur tourne en **service systemd utilisateur** (démarre au boot grâce à
`loginctl enable-linger motmot3000`), dans `~/services/game-of-more/`.

```bash
# 1) copier les fichiers
rsync -az --exclude node_modules --exclude .git --exclude data \
  index.html styles.css src server assets package.json \
  cagipi:services/game-of-more/

# 2) activer/démarrer le service
systemctl --user daemon-reload
systemctl --user enable --now game-of-more.service
```

Le service :

```ini
[Unit]
Description=Game of More backend (127.0.0.1:5180)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=PORT=5180
Environment=DATA_DIR=/home/motmot3000/services/game-of-more/data
WorkingDirectory=/home/motmot3000/services/game-of-more
ExecStart=/usr/bin/node /home/motmot3000/services/game-of-more/server/server.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Exposition publique (Tailscale Funnel) :

```bash
# cockpit (dashboard) : reste sur le tailnet, via HTTP
sudo tailscale serve --http=80 --bg http://127.0.0.1:3010
# jeu : public sur internet
sudo tailscale funnel --set-path /game-of-more --bg http://127.0.0.1:5180
```

Exposition par nginx (option alternative, pour un domaine dédié —
fichier `/etc/nginx/sites-available/game-of-more`, lié dans `sites-enabled/`) :

```nginx
server {
    listen 80;
    server_name game-of-more.lecagibi.ch;

    location / {
        proxy_pass http://127.0.0.1:5180;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis `sudo nginx -t && sudo systemctl reload nginx`.

## Sauvegarde

- Les données vivent dans `data/state.json` (`~/services/game-of-more/data/`).
- Les 60 dernières versions sont dans `data/backups/`.
- **Astuce** : l'app propose aussi un export/import JSON manuel (bouton ⬇/⬆)
  dans la console du prof, utile comme sauvegarde de secours.
