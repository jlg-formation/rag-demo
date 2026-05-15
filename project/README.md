# Mini RAG Demo

Une démo RAG minimale pour formation, mais avec de vrais services : embeddings OpenAI, base vectorielle Pinecone et génération de réponse via un modèle de chat OpenAI.

## Stack

- Bun workspace
- API Bun + Elysia
- Frontend Vite + React + TypeScript
- OpenAI SDK
- Pinecone SDK

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

## Prérequis Pinecone

Créer un index Pinecone compatible avec le modèle d'embedding choisi.

- Avec `text-embedding-3-small`, la dimension attendue est `1536`.
- Le nom de l'index, et éventuellement son host, sont saisis dans l'interface.

Le backend ne persiste pas les clés sur disque. Le frontend les envoie au backend pour la session courante, et le backend les conserve en mémoire tant que le processus tourne.

## Build

```bash
bun run build
```

## Principe

1. Le frontend envoie les clés OpenAI et Pinecone au backend via une route de configuration.
2. Le corpus est découpé en chunks.
3. L'API appelle OpenAI pour produire les embeddings des chunks.
4. Les vecteurs sont insérés dans Pinecone dans un namespace dédié à la session.
5. La question est vectorisée puis envoyée à Pinecone pour récupérer les meilleurs chunks.
6. Ces chunks sont injectés dans une requête de chat OpenAI pour produire la réponse finale.

Cette démo reste volontairement simple, mais elle montre une vraie chaîne RAG de bout en bout.
