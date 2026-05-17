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

## Mode opératoire détaillé

## Étape 1 - Créer l'entrée DNS dans OVH

Objectif : faire pointer `rag.jlg-consulting.com` vers le VPS.

Dans OVH :

1. ouvrez la zone DNS de `jlg-consulting.com`
2. créez un enregistrement de type `A`
3. nom : `rag`
4. cible : `IP_PUBLIQUE_DU_VPS`
5. TTL : `300` si OVH le permet, sinon laissez la valeur par défaut

Résultat attendu :

- `rag.jlg-consulting.com` résout vers votre VPS

Vérification depuis votre machine :

```bash
nslookup rag.jlg-consulting.com
```

Attendez que le nom de domaine pointe bien vers la bonne IP avant de continuer.

## Étape 2 - Se connecter au VPS

Depuis votre poste local :

```bash
ssh votre_utilisateur@IP_PUBLIQUE_DU_VPS
```

Une fois connecté, travaillez en mode administrateur avec `sudo`.

## Étape 3 - Préparer les paquets système utiles

Sur le VPS :

```bash
sudo apt update
sudo apt install -y git curl certbot python3-certbot-nginx
```

Si `certbot` est déjà installé, cette commande ne pose pas de problème.

## Étape 4 - Vérifier UFW

Objectif : n'exposer publiquement que SSH, HTTP et HTTPS.

Sur le VPS :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw status
```

Résultat attendu dans le statut :

- `OpenSSH` autorisé
- `Nginx Full` autorisé

Important :

- n'ouvrez pas le port `3000`
- dans cette architecture, `3000` est lié seulement à `127.0.0.1`

## Étape 5 - Installer le code applicatif sur le VPS

Choisissez un répertoire de travail simple dans le compte `debian`, par exemple `$HOME/rag-demo`.

Sur le VPS :

```bash
mkdir -p "$HOME/rag-demo"
cd "$HOME/rag-demo"
git clone URL_DU_DEPOT .
```

Si votre dépôt n'est pas clonable depuis le VPS, alternative :

1. copiez le dépôt manuellement dans `$HOME/rag-demo`
2. vérifiez ensuite que le sous-dossier `project/` existe bien

## Étape 6 - Préparer l'environnement de production Docker

Placez-vous dans le dossier applicatif contenant `docker-compose.prod.yml`.

```bash
cd "$HOME/rag-demo/project"
cp deploy/.env.production.example .env.production
nano .env.production
```

Remplissez au minimum le fichier avec vos vraies valeurs :

```dotenv
SESSION_SECRET=remplacez-par-une-longue-valeur-aleatoire
BOOTSTRAP_ADMIN_EMAIL=admin@jlg-consulting.com
BOOTSTRAP_ADMIN_PASSWORD=mot-de-passe-tres-fort
BOOTSTRAP_ADMIN_DISPLAY_NAME=Administrateur JLG
```

Puis protégez ce fichier :

```bash
chmod 600 .env.production
```

## Étape 7 - Démarrer la stack Docker

Toujours dans `$HOME/rag-demo/project` :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Vérifiez l'état des conteneurs :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Résultat attendu :

- `rag-demo-app` en état `running` ou `healthy`

Si un conteneur échoue, lisez les journaux :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app
```

## Étape 8 - Vérifier le service web local au VPS

Avant de publier via NGINX, confirmez que la stack répond sur le proxy local :

```bash
curl -I http://127.0.0.1:3000
```

Vous devez obtenir une réponse HTTP, par exemple `200 OK` ou `304 Not Modified`.

## Étape 9 - Installer la configuration NGINX hôte

Copiez la configuration fournie :

```bash
sudo cp "$HOME/rag-demo/project/deploy/nginx/rag.jlg-consulting.com.conf" /etc/nginx/sites-available/rag.jlg-consulting.com.conf
sudo ln -s /etc/nginx/sites-available/rag.jlg-consulting.com.conf /etc/nginx/sites-enabled/rag.jlg-consulting.com.conf
```

Si le lien symbolique existe déjà, ne le recréez pas.

Vérifiez la configuration :

```bash
sudo nginx -t
```

Si le test est correct, rechargez NGINX :

```bash
sudo systemctl reload nginx
```

À ce stade, le site doit déjà répondre en HTTP sur :

- `http://rag.jlg-consulting.com`

## Étape 10 - Activer HTTPS avec Certbot

Sur le VPS :

```bash
sudo certbot --nginx -d rag.jlg-consulting.com
```

Répondez aux questions de Certbot :

1. fournissez une adresse e-mail valide
2. acceptez les conditions
3. choisissez la redirection HTTP vers HTTPS quand Certbot le propose

Résultat attendu :

- certificat Let’s Encrypt émis
- configuration NGINX ajustée automatiquement
- redirection HTTP vers HTTPS activée

Vérification :

```bash
curl -I https://rag.jlg-consulting.com
```

## Étape 11 - Vérifier l'application en conditions réelles

Dans le navigateur :

1. ouvrez `https://rag.jlg-consulting.com`
2. connectez-vous avec l'identifiant et le mot de passe définis dans `.env.production`
3. vérifiez que l'interface s'affiche correctement
4. vérifiez qu'aucune erreur réseau n'apparaît dans l'application

Puis, dans l'interface :

1. saisissez la configuration OpenAI
2. saisissez la configuration Pinecone
3. indiquez le nom de l'index Pinecone
4. indiquez le host Pinecone si la résolution automatique échoue
5. enregistrez
6. testez l'indexation d'un petit document `.md` ou `.txt`
7. posez une question pour valider la chaîne RAG complète

## Vérifications post-déploiement recommandées

### Vérifier les conteneurs

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

### Vérifier les journaux en direct

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

### Vérifier le renouvellement automatique du certificat

```bash
sudo systemctl status certbot.timer
```

## Sauvegarde minimale à mettre en place

Le répertoire critique à sauvegarder est :

- `$HOME/rag-demo/project/apps/api/data/`

Il contient :

- les comptes utilisateurs
- les sessions
- les documents indexés en base logique
- la configuration RAG, y compris des secrets opérationnels

Sauvegarde simple manuelle :

```bash
tar -czf "$HOME/rag-demo-backup-$(date +%F).tar.gz" "$HOME/rag-demo/project/apps/api/data"
```

## Procédure de mise à jour

Quand vous modifiez le code et voulez redéployer :

```bash
cd "$HOME/rag-demo"
git pull
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Contrôles après mise à jour :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100
```

## Procédure de redémarrage

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

## Procédure d'arrêt

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Les données resteront présentes car elles sont stockées dans `apps/api/data/` sur le disque du VPS.

## Procédure de retour arrière simple

Si une mise à jour casse l'application :

1. revenez à la version Git précédente
2. relancez le build Docker
3. conservez le répertoire `apps/api/data/` intact

Exemple :

```bash
cd "$HOME/rag-demo"
git log --oneline -n 5
git checkout ID_DU_COMMIT_STABLE
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Tableau de diagnostic rapide

### Cas 1 - Le domaine ne répond pas

Causes probables :

- DNS OVH pas propagé
- NGINX non rechargé
- UFW mal configuré

Commandes utiles :

```bash
nslookup rag.jlg-consulting.com
sudo nginx -t
sudo systemctl status nginx
sudo ufw status
```

### Cas 2 - NGINX répond mais pas l'application

Causes probables :

- conteneur `app` arrêté
- erreur de build frontend intégré
- proxy vers `127.0.0.1:3000` indisponible

Commandes utiles :

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app
curl -I http://127.0.0.1:3000
```

### Cas 3 - L'interface s'affiche mais l'authentification échoue

Causes probables :

- mauvais identifiants initiaux
- ancien fichier `users.json` déjà présent
- backend API en erreur

Commandes utiles :

```bash
cd "$HOME/rag-demo/project"
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app
```

Rappel important :

- les variables `BOOTSTRAP_ADMIN_*` ne recréent pas automatiquement un compte si les données existent déjà

### Cas 4 - L'application fonctionne mais le RAG échoue

Causes probables :

- clé OpenAI invalide
- clé Pinecone invalide
- host Pinecone manquant
- index Pinecone de mauvaise dimension

Rappel technique pour cette démo :

- le modèle `text-embedding-3-small` attend une dimension `1536`

## Résumé opératoire très court

Si vous voulez l'enchaînement minimal :

1. créer l'entrée DNS `rag` chez OVH
2. cloner le dépôt dans `$HOME/rag-demo`
3. créer `$HOME/rag-demo/project/.env.production`
4. lancer `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build`
5. installer la config NGINX hôte
6. lancer `sudo certbot --nginx -d rag.jlg-consulting.com`
7. ouvrir `https://rag.jlg-consulting.com`
8. se connecter avec le compte admin initial
9. configurer OpenAI et Pinecone dans l'interface

## Décision finale recommandée

Pour ce projet précis, la stratégie de déploiement recommandée est donc :

- Docker Compose pour un seul service applicatif
- NGINX hôte pour le domaine et TLS
- UFW limité à `OpenSSH` et `Nginx Full`
- persistance locale de `apps/api/data/`
- sauvegarde régulière de ce répertoire

Cette approche est la plus simple à exploiter sur un VPS OVH sans introduire de complexité inutile.
