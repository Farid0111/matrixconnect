# Formulaire wifi gratuit — Wifi Banikoara

Page de collecte des informations (nom, téléphone, zone) des clients qui activent le
**wifi gratuit 7 jours**, branchée sur Firebase Firestore.

## Fichiers

- `merci.html` — le formulaire (design aligné sur la page de connexion du portail)
- `firebase-leads.js` — envoi des fiches vers Firestore
- `img/` — logo et favicon

## Publier sur GitHub Pages

1. Créer un dépôt (par exemple `wifi-banikoara`) et y déposer le contenu de `site/`.
2. Settings → Pages → Source : branche `main`, dossier `/ (root)` → Save.
3. L'adresse du site sera `https://<votre-compte>.github.io/wifi-banikoara/`.

## Brancher le portail MikroTik

Dans `alogin.html` (page servie par le routeur après la connexion réussie), remplacer :

```js
var FORMULAIRE_URL = "https://exemple.github.io/hotspot/merci.html";
```

par l'adresse réelle du site, par exemple :

```js
var FORMULAIRE_URL = "https://<votre-compte>.github.io/wifi-banikoara/merci.html";
```

Le routeur redirige alors le client vers cette page en ajoutant automatiquement :

- `?mac=` — adresse MAC de l'appareil (fournie par `$(mac)`)
- `?user=` — identifiant de connexion `T-<mac>`
- `?ip=` — adresse IP du client sur le hotspot

## Firestore

Projet `fahdbot-ace64`, collection `leads`. Chaque inscription crée un document :

| Champ | Contenu |
|---|---|
| `nom` | nom et prénom saisis |
| `tel` | numéro de téléphone |
| `zone` | zone choisie parmi les 9 de Banikoara centre |
| `mac` | adresse MAC de l'appareil |
| `user` | identifiant de connexion `T-<mac>` |
| `ip` | adresse IP sur le réseau |
| `date` | horodatage de l'envoi |

La clé API est publique dans `firebase-leads.js` (usage client uniquement). Si un jour
vous voulez interdire les écritures anonimes, activez l'authentification anonyme et
renforcez les règles Firestore.
