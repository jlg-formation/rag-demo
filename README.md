# Demo RAG

Ce depot contient une demo RAG multi-utilisateur avec controle d'acces par groupes, un backend Bun + Elysia, un frontend Vite + React, ainsi que des outils pour generer et importer un corpus de demonstration.

## Structure

- `project/` : application principale, avec `apps/api` et `apps/web`
- `content/` : corpus Markdown de demonstration pret a etre indexe
- `tools/` : scripts de generation de corpus et d'import en lot
- `input/` : notes de cadrage et demandes fonctionnelles
- `UX-AUDIT/` : audit UX du projet

## Prerequis

- Bun `1.3.14` ou compatible
- Node.js recent pour executer les scripts utilitaires en `.mjs`
- Un compte OpenAI et un index Pinecone si l'on veut indexer reellement des documents

## Installation

Depuis la racine du depot :

```bash
bun run install:project
```

Cette commande installe les dependances de l'application situee dans `project/`.

## Scripts racine

Le `package.json` racine sert de point d'entree unique pour piloter la demo et les outils annexes.

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

### Corpus de demonstration

- `bun run content:generate -- <source1> <source2> ...`
  Genere un corpus Markdown dans `content/` d'environ 1 Mo a partir de fichiers source produits en amont. Le script de base positionne deja `--outDir ./content --targetBytes 1048576`; il faut simplement ajouter les chemins des sources apres `--`.

  Exemple :

  ```bash
  bun run content:generate -- C:/tmp/admin.txt C:/tmp/patients.txt C:/tmp/docteurs.txt C:/tmp/dsi.txt C:/tmp/rh.txt
  ```

- `bun run content:import:dry-run`
  Analyse le contenu de `content/`, calcule la volumetrie, liste les groupes detectes et montre les comptes techniques qui seraient utilises pour l'import, sans rien envoyer a l'API. Ce mode peut etre lance seul depuis la racine du depot, meme si le backend n'est pas demarre.

- `bun run content:import`
  Importe en lot les documents presents dans `content/` vers l'API locale sur `http://localhost:3000`. Le script cree au besoin des groupes et des comptes techniques dedies de type `import-<groupe>@demo.local`.
  La progression s'affiche dans le terminal en pourcentage, fichier par fichier, jusqu'a 100 %.
  Pour un serveur VPS avec un compte administrateur personnalise, utilisez plutot le script avec des arguments explicites, par exemple : `node ./tools/bulk-import-content.mjs --api http://127.0.0.1:3000 --content ./content --admin-email admin@jlg-consulting.com --admin-password <mot-de-passe>`.

## Demarrage rapide

1. Installer les dependances avec `bun run install:project`.
2. Demarrer l'API avec `bun run dev:api`.
3. Demarrer le frontend avec `bun run dev:web`.
4. Ouvrir l'interface web sur `http://localhost:5173`.
5. Configurer OpenAI et Pinecone dans l'interface d'administration.
6. Verifier le corpus avec `bun run content:import:dry-run`.
7. Importer le corpus avec `bun run content:import`.

## Comptes et acces

- Compte initial : `admin`
- Mot de passe initial : `admin`
- Le groupe `admin` est cree automatiquement au demarrage.

L'API applique un controle d'acces par groupe : un document est rattache a un seul groupe, et seuls les utilisateurs membres de ce groupe peuvent l'indexer, le consulter ou le supprimer.

## Corpus et import

Le repertoire `content/` contient un corpus de demonstration reparti par groupes :

- `admin`
- `patients`
- `docteurs`
- `dsi`
- `ressources-humaines`

Le script d'import en lot repose sur l'endpoint existant `/api/documents/upload`. Il se connecte avec le compte administrateur, verifie les groupes, cree si necessaire un compte importeur par groupe, puis pousse les fichiers Markdown du groupe avec un utilisateur autorise.

Si l'API n'est pas demarree, ou si la configuration RAG n'est pas encore renseignee, l'import s'arretera avec un message explicite.

## Notes utiles

- L'application principale conserve sa propre documentation dans `project/README.md`.
- Les donnees JSON de l'API sont stockees dans `project/apps/api/data/`.
- Les secrets de configuration RAG ne doivent pas etre commités.

## Commandes recommandees

```bash
bun run install:project
bun run dev:api
bun run dev:web
bun run build
bun run typecheck
bun run content:import:dry-run
bun run content:import
```
