# Déploiement de la démo RAG sur le VPS OVH

## Objectif

Déployer l'application sur l'URL suivante :

- `https://rag.jlg-consulting.com`

Contrainte d'exploitation :

- Docker déjà installé sur le VPS
- NGINX déjà installé sur le VPS
- UFW déjà présent sur le VPS
- utilisateur débutant en déploiement
- besoin d'un mode opératoire pas à pas, avec opérations manuelles explicites

## Architecture cible retenue

Architecture recommandée pour ce projet :

1. un conteneur Docker `app` exécute Bun/Elysia sur le port interne `3000`
2. ce conteneur sert à la fois l'API et le frontend Vite compilé
3. le NGINX du VPS sert de reverse proxy public et termine TLS pour `rag.jlg-consulting.com`
4. UFW n'ouvre publiquement que `22`, `80` et `443`

Pourquoi cette architecture est la bonne ici :

- elle respecte votre contrainte d'avoir Docker sur le VPS
- elle évite d'exposer directement l'API au réseau public
- elle garde NGINX hôte comme point d'entrée unique HTTPS
- elle reste simple à exploiter pour un débutant
- elle permet de persister les données JSON du backend sur disque côté VPS

## Fichiers de déploiement ajoutés dans le projet

Les fichiers suivants servent de base de production :

- `.dockerignore`
- `project/Dockerfile.api`
- `project/docker-compose.prod.yml`
- `project/deploy/.env.production.example`
- `project/deploy/nginx/rag.jlg-consulting.com.conf`

## Points importants spécifiques à cette application

### 1. Données persistées localement

Le backend stocke ses données dans :

- `project/apps/api/data/groups.json`
- `project/apps/api/data/users.json`
- `project/apps/api/data/sessions.json`
- `project/apps/api/data/documents.json`
- `project/apps/api/data/rag-settings.json`

Ces fichiers sont persistés sur le VPS grâce à un montage Docker.

### 2. Secrets OpenAI et Pinecone

Les secrets OpenAI et Pinecone ne sont pas fournis via le fichier `.env.production` dans l'état actuel du projet.
Ils sont saisis dans l'interface d'administration de l'application puis stockés dans `rag-settings.json`.

Conséquence pratique :

- il faut protéger le répertoire `project/apps/api/data/`
- il faut sauvegarder ce répertoire

### 3. Compte administrateur initial

Le projet a été ajusté pour permettre de définir le compte administrateur initial via variables d'environnement :

- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_DISPLAY_NAME`

Important :

- ces valeurs servent surtout au premier démarrage
- si `project/apps/api/data/users.json` existe déjà, changer ces variables ne remplacera pas automatiquement l'utilisateur déjà créé

### 4. Cookie de session sécurisé

Le projet a été ajusté pour activer le flag `Secure` des cookies de session en production.

### 5. Contexte de build Docker

Le déploiement Docker utilise la racine du dépôt comme contexte de build, même si la commande `docker compose` est lancée depuis `project/`.

Pourquoi :

- le frontend compile des ressources situées hors de `project/`
- notamment les fichiers JSON présents dans `benchmarks/`
- si le build Docker part seulement de `project/`, ces fichiers sont absents et la compilation échoue

En pratique :

- la commande de déploiement se lance bien depuis `$HOME/rag-demo/project`
- mais `docker-compose.prod.yml` construit l'image depuis `..`

## Prérequis avant intervention

Vous devez disposer de :

- l'adresse IP publique du VPS OVH
- un accès SSH au VPS
- le domaine `jlg-consulting.com` géré dans OVH
- les droits pour créer un sous-domaine DNS `rag`
- si possible, le dépôt du projet accessible par `git clone`

Si le dépôt n'est pas accessible par Git depuis le VPS, il faudra transférer le dossier du projet manuellement. Le mode opératoire ci-dessous part du cas le plus simple : dépôt clonable sur le VPS.

Choix d'installation retenu dans ce manuel :

- exécution sous le compte `debian`
- installation dans `$HOME/rag-demo`

Ce choix est adapté à votre contexte car il reste simple, lisible et sans gestion supplémentaire de permissions sur un VPS où vous administrez vous-même l'application.

Point de vigilance :

- le compte `debian` doit pouvoir exécuter `docker` et `docker compose`
- si `docker ps` renvoie une erreur de permission, deux options existent
- soit vous utilisez `sudo` devant les commandes Docker
- soit vous ajoutez `debian` au groupe `docker`, ce qui est plus confortable au quotidien

Commande d'activation du groupe `docker` :

```bash
sudo usermod -aG docker debian
```

Après cette commande, déconnectez-vous puis reconnectez-vous en SSH pour que le nouveau groupe soit pris en compte.

## Variables de production à préparer

Vous devrez définir au minimum :

- `SESSION_SECRET` : longue chaîne aléatoire, au moins 32 caractères
- `BOOTSTRAP_ADMIN_EMAIL` : identifiant administrateur initial
- `BOOTSTRAP_ADMIN_PASSWORD` : mot de passe administrateur initial fort
- `BOOTSTRAP_ADMIN_DISPLAY_NAME` : nom lisible du compte administrateur

Exemple de secret robuste :

```text
SESSION_SECRET=rag-demo-prod-2026-Changez-Cette-Valeur-Longue-Et-Aleatoire
```

## Ce qui relève du besoin

Ce document conserve le cadrage, les contraintes et les décisions d'architecture pour le déploiement.

Le mode opératoire détaillé a été déplacé dans `DEPLOY.md` à la racine du dépôt afin de séparer :

- le besoin et les décisions de conception dans `input/12-deploiement.md`
- la procédure exécutable de déploiement dans `DEPLOY.md`

## Résumé opératoire attendu

L'enchaînement cible reste le suivant :

1. créer l'entrée DNS `rag` chez OVH
2. installer le dépôt dans `$HOME/rag-demo`
3. préparer `project/.env.production`
4. lancer `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build`
5. installer la configuration NGINX hôte
6. activer TLS avec Certbot
7. vérifier l'accès à `https://rag.jlg-consulting.com`
8. se connecter avec le compte administrateur initial
9. configurer OpenAI et Pinecone dans l'interface

## Décision finale recommandée

Pour ce projet précis, la stratégie de déploiement recommandée est donc :

- Docker Compose pour un seul service applicatif
- NGINX hôte pour le domaine et TLS
- UFW limité à `OpenSSH` et `Nginx Full`
- persistance locale de `apps/api/data/`
- sauvegarde régulière de ce répertoire

Cette approche est la plus simple à exploiter sur un VPS OVH sans introduire de complexité inutile.
