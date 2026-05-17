# Guide du développeur

## Objectif

Ce guide regroupe les informations utiles pour travailler localement sur la démo RAG : installation, scripts, démarrage, comptes initiaux et import du corpus.

## Prérequis

- Bun `1.3.14` ou compatible
- Node.js récent pour exécuter les scripts utilitaires en `.mjs`
- Un compte OpenAI et un index Pinecone si l'on veut indexer réellement des documents

## Installation

Depuis la racine du dépôt :

```bash
bun run install:project
```

Cette commande installe les dépendances de l'application située dans `project/`.

## Scripts racine

Le `package.json` racine sert de point d'entrée unique pour piloter la démo et les outils annexes.

### Application

- `bun run dev:api`
  Lance l'API locale depuis `project/apps/api`.

- `bun run dev:web`
  Lance le frontend local depuis `project/apps/web`.

- `bun run build`
  Construit l'API et le frontend.

- `bun run build:api`
  Construit uniquement l'API.

- `bun run build:web`
  Construit uniquement le frontend.

- `bun run typecheck`
  Lance le typecheck sur l'ensemble de l'application.

- `bun run typecheck:api`
  Lance le typecheck uniquement sur l'API.

- `bun run typecheck:web`
  Lance le typecheck uniquement sur le frontend.

### Corpus de démonstration

- `bun run content:generate -- <source1> <source2> ...`
  Génère un corpus Markdown dans `content/` d'environ 1 Mo à partir de fichiers source produits en amont. Le script de base positionne déjà `--outDir ./content --targetBytes 1048576`; il faut simplement ajouter les chemins des sources après `--`.

  Exemple :

  ```bash
  bun run content:generate -- C:/tmp/admin.txt C:/tmp/patients.txt C:/tmp/docteurs.txt C:/tmp/dsi.txt C:/tmp/rh.txt
  ```

- `bun run content:import:dry-run`
  Analyse le contenu de `content/`, calcule la volumétrie, liste les groupes détectés et montre les comptes techniques qui seraient utilisés pour l'import, sans rien envoyer à l'API. Ce mode peut être lancé seul depuis la racine du dépôt, même si le backend n'est pas démarré.

- `bun run content:import`
  Importe en lot les documents présents dans `content/` vers l'API locale sur `http://localhost:3000`. Le script crée au besoin des groupes et des comptes techniques dédiés de type `import-<groupe>@demo.local`.
  La progression s'affiche dans le terminal en pourcentage, fichier par fichier, jusqu'à 100 %.
  Pour un serveur VPS avec un compte administrateur personnalisé, utilisez plutôt le script avec des arguments explicites, par exemple : `node ./tools/bulk-import-content.mjs --api http://127.0.0.1:3000 --content ./content --admin-email admin@jlg-consulting.com --admin-password <mot-de-passe>`.

## Démarrage rapide

1. Installer les dépendances avec `bun run install:project`.
2. Démarrer l'API avec `bun run dev:api`.
3. Démarrer le frontend avec `bun run dev:web`.
4. Ouvrir l'interface web sur `http://localhost:5173`.
5. Configurer OpenAI et Pinecone dans l'interface d'administration.
6. Vérifier le corpus avec `bun run content:import:dry-run`.
7. Importer le corpus avec `bun run content:import`.

## Comptes et accès

- Compte initial : `admin`
- Mot de passe initial : `admin`
- Le groupe `admin` est créé automatiquement au démarrage.

L'API applique un contrôle d'accès par groupe : un document est rattaché à un seul groupe, et seuls les utilisateurs membres de ce groupe peuvent l'indexer, le consulter ou le supprimer.

## Corpus et import

Le répertoire `content/` contient un corpus de démonstration réparti par groupes :

- `admin`
- `patients`
- `docteurs`
- `dsi`
- `ressources-humaines`

Le script d'import en lot repose sur l'endpoint existant `/api/documents/upload`. Il se connecte avec le compte administrateur, vérifie les groupes, crée si nécessaire un compte importeur par groupe, puis pousse les fichiers Markdown du groupe avec un utilisateur autorisé.

Si l'API n'est pas démarrée, ou si la configuration RAG n'est pas encore renseignée, l'import s'arrêtera avec un message explicite.

## Notes utiles

- L'application principale conserve sa propre documentation dans `project/README.md`.
- Le mode opératoire de déploiement VPS est documenté dans `DEPLOY.md`.
- Les données JSON de l'API sont stockées dans `project/apps/api/data/`.
- Les secrets de configuration RAG ne doivent pas être commités.

## Commandes recommandées

```bash
bun run install:project
bun run dev:api
bun run dev:web
bun run build
bun run typecheck
bun run content:import:dry-run
bun run content:import
```
