# Demo RAG

Ce depot contient une demo RAG multi-utilisateur avec controle d'acces par groupes, un backend Bun + Elysia, un frontend Vite + React, ainsi que des outils pour generer et importer un corpus de demonstration.

## Structure

- `project/` : application principale, avec `apps/api` et `apps/web`
- `content/` : corpus Markdown de demonstration pret a etre indexe
- `tools/` : scripts de generation de corpus et d'import en lot
- `input/` : notes de cadrage et demandes fonctionnelles
- `UX-AUDIT/` : audit UX du projet

## Documentation

- Guide developpeur : [DEVELOP.md](./DEVELOP.md)
- Guide de deploiement : [DEPLOY.md](./DEPLOY.md)
- Documentation applicative detaillee : [project/README.md](./project/README.md)

## Deploiement

Le guide de deploiement pas a pas pour le VPS OVH est disponible dans [DEPLOY.md](./DEPLOY.md).

## Demarrage rapide

1. Installer les dependances avec `bun run install:project`.
2. Demarrer l'API avec `bun run dev:api`.
3. Demarrer le frontend avec `bun run dev:web`.
4. Ouvrir l'interface web sur `http://localhost:5173`.
5. Configurer OpenAI et Pinecone dans l'interface d'administration.
6. Verifier le corpus avec `bun run content:import:dry-run`.
7. Importer le corpus avec `bun run content:import`.

Les details d'installation, la liste complete des scripts, les comptes initiaux et la procedure de travail locale sont documentes dans [DEVELOP.md](./DEVELOP.md).

## Notes utiles

- Le guide developpeur centralise l'installation locale et les scripts dans `DEVELOP.md`.
- Le mode operatoire de deploiement VPS est documente dans `DEPLOY.md`.
- Les donnees JSON de l'API sont stockees dans `project/apps/api/data/`.
- Les secrets de configuration RAG ne doivent pas etre commités.
