# Mini RAG Demo

Une démo RAG minimale pour formation : ingestion d'un petit corpus, découpage en chunks, recherche par similarité lexicale, puis génération d'une réponse extractive à partir des passages retrouvés.

## Stack

- Bun workspace
- API Bun + Elysia
- Frontend Vite + React + TypeScript

## Démarrage

```bash
cd project
bun install
```

Dans un terminal :

```bash
bun run dev:api
```

Dans un second terminal :

```bash
bun run dev:web
```

Le frontend est disponible sur `http://localhost:5173` et l'API sur `http://localhost:3000`.

## Build

```bash
bun run build
```

## Principe

1. Le corpus est saisi dans l'interface.
2. L'API le découpe en petits passages.
3. Chaque passage reçoit un score par recouvrement de mots avec la question.
4. Les meilleurs passages servent de contexte.
5. Une réponse courte est synthétisée à partir des phrases les plus pertinentes.

Ce n'est pas un RAG de production, mais la chaîne complète est visible et facilement explicable.
