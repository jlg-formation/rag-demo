# Mini RAG Demo

Une démo RAG de formation avec de vrais services : embeddings OpenAI, base vectorielle Pinecone, génération via un modèle de chat OpenAI, et désormais une gestion utilisateur complète avec contrôle d'accès par groupes.

## Stack

- Bun workspace
- API Bun + Elysia
- Frontend Vite + React + TypeScript
- OpenAI SDK
- Pinecone SDK
- Persistance JSON côté backend

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

## Connexion initiale

- Identifiant : `admin`
- Mot de passe : `admin`

Le groupe `admin` est créé automatiquement au démarrage, ainsi que le compte initial de démonstration.

## Prérequis Pinecone

Créer un index Pinecone compatible avec le modèle d'embedding choisi.

- Avec `text-embedding-3-small`, la dimension attendue est `1536`.
- Le nom de l'index, et éventuellement son host, sont saisis dans l'interface.

## Persistance JSON

Le backend crée plusieurs fichiers JSON dans `apps/api/data/` pour stocker :

- les utilisateurs
- les groupes
- les sessions
- les documents indexés
- la configuration RAG globale

La configuration RAG saisie dans l'interface est donc gérée par le backend. Comme elle contient des secrets, `apps/api/data/*.json` est ignoré par Git.

## Build

```bash
bun run build
```

## Principe

1. L'utilisateur se connecte par cookie de session signé.
2. Les administrateurs créent groupes et comptes depuis le dashboard.
3. Un document indexé appartient à un groupe unique.
4. Seul un utilisateur membre de ce groupe peut indexer, voir ou supprimer ce document.
5. Le backend vectorise le document avec OpenAI puis insère ses chunks dans Pinecone avec des métadonnées de filtrage.
6. Lors d'une question, l'API filtre Pinecone sur les groupes autorisés de l'utilisateur connecté.
7. Les chunks retrouvés sont injectés dans le prompt du modèle de chat OpenAI pour produire la réponse finale.

Cette démo reste volontairement simple, mais elle montre désormais une chaîne RAG multi-utilisateur cohérente de bout en bout.
