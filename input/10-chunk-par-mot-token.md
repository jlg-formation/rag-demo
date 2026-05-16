# Spécification détaillée - mode de découpage des chunks par mot ou par token

## Objectif

Faire évoluer le pipeline d'indexation pour que le découpage d'un document ne soit plus limité aux caractères.

Le système doit proposer trois modes de chunking :

- `characters` : comportement actuel, conservé pour compatibilité.
- `words` : découpage par nombre de mots.
- `tokens` : découpage par nombre de tokens, calculés avec `js-tiktoken`.

L'objectif est de permettre de comparer plusieurs stratégies de segmentation dans la démo RAG, sans casser le flux actuel d'indexation ni l'interface existante.

## Contexte existant

Aujourd'hui, le projet applique un chunking simple par caractères :

- `chunkSize` : taille d'un chunk en caractères.
- `chunkOverlap` : overlap en caractères.
- `chunkStride` : valeur dérivée `chunkSize - chunkOverlap`.
- validation stricte : `chunkOverlap < chunkSize`.

Ce comportement est utilisé :

- dans le backend d'indexation ;
- dans l'écran Documents ;
- dans le résumé de configuration RAG renvoyé au frontend.

La dépendance `js-tiktoken` est déjà présente dans le workspace, donc le mode `tokens` doit s'appuyer dessus et non sur une approximation maison.

## Résultat attendu

L'utilisateur doit pouvoir choisir, au moment de l'indexation et dans la configuration RAG par défaut, l'unité de découpage :

- caractères ;
- mots ;
- tokens.

Pour une unité donnée, les paramètres doivent garder la même logique :

- taille du chunk ;
- overlap ;
- stride calculé automatiquement.

Exemple :

- `mode = words`, `chunkSize = 120`, `chunkOverlap = 20` signifie des chunks de 120 mots avec un recouvrement de 20 mots ;
- `mode = tokens`, `chunkSize = 300`, `chunkOverlap = 40` signifie des chunks de 300 tokens avec un recouvrement de 40 tokens.

## Exigences fonctionnelles

### 1. Modes de chunking

Le système doit supporter explicitement les valeurs suivantes :

- `characters`
- `words`
- `tokens`

Le mode par défaut doit rester `characters` pour préserver la compatibilité ascendante avec les données, l'UI et les appels API déjà en place.

### 2. Paramètres associés

Chaque mode repose sur les mêmes paramètres métiers :

- `chunkSize` : entier strictement positif.
- `chunkOverlap` : entier positif ou nul.
- `chunkStride` : entier dérivé, non stocké en entrée, calculé par `chunkSize - chunkOverlap`.

La règle de validation reste identique quel que soit le mode :

- `chunkOverlap` doit rester strictement inférieur à `chunkSize`.

### 3. Découpage par caractères

Le comportement actuel doit être conservé :

- normalisation du texte source avant découpage ;
- itération par stride ;
- extraction de sous-chaînes ;
- suppression des chunks vides.

Ce mode sert de référence de compatibilité.

### 4. Découpage par mots

Le mode `words` doit découper sur une base lexicale simple et déterministe.

Règles attendues :

- le texte est normalisé avant calcul ;
- les séparateurs multiples sont réduits pour éviter les écarts de comptage ;
- le comptage des mots se fait sur une segmentation simple par espaces après normalisation ;
- le stride s'exprime en nombre de mots ;
- le texte final de chaque chunk est reconstruit sous forme de chaîne lisible, avec espaces simples entre mots.

Le but de ce mode n'est pas de produire une tokenisation linguistique avancée, mais un découpage stable et compréhensible pour la démo.

### 5. Découpage par tokens

Le mode `tokens` doit utiliser `js-tiktoken`.

Règles attendues :

- le texte est normalisé avant encodage ;
- l'encodage doit être cohérent avec les modèles OpenAI utilisés dans la démo ;
- le mode recommandé est `cl100k_base`, sauf si le code existant impose une autre table explicitement compatible avec les modèles configurés ;
- `chunkSize`, `chunkOverlap` et `chunkStride` s'expriment en tokens ;
- chaque chunk est formé à partir d'une fenêtre de tokens, puis décodé vers une chaîne avant embedding ;
- le découpage doit rester déterministe pour un même texte et une même configuration.

Le projet ne doit pas estimer les tokens via une heuristique de caractères : le comptage doit venir de `js-tiktoken`.

## Évolution du modèle de données

### Configuration RAG persistée

La configuration backend persistée doit intégrer un nouveau champ :

- `chunkMode` avec les valeurs `characters | words | tokens`.

Comportement attendu :

- si le champ est absent dans des données existantes, la valeur par défaut doit être `characters` ;
- les anciens enregistrements doivent donc continuer à fonctionner sans migration bloquante.

### Résumés renvoyés au frontend

Les payloads de configuration doivent exposer au minimum :

- `chunkMode`
- `chunkSize`
- `chunkOverlap`
- `chunkStride`

Le frontend doit pouvoir afficher l'unité active de manière explicite.

### Métadonnées documentaires

Pour améliorer la traçabilité, chaque document indexé devrait idéalement conserver, dans son enregistrement ou dans des métadonnées associées, la configuration de chunking utilisée au moment de l'indexation :

- `chunkMode`
- `chunkSize`
- `chunkOverlap`

Cette conservation n'est pas strictement obligatoire pour la première itération si elle alourdit trop le modèle, mais elle est fortement recommandée pour rendre la démo explicable.

## Évolution API

### Requêtes d'indexation

L'API d'upload / d'indexation doit accepter un nouveau paramètre :

- `chunkMode`

Règles :

- si absent, utiliser `characters` ou la valeur par défaut issue de la configuration RAG ;
- si présent mais invalide, renvoyer une erreur `400` explicite ;
- la validation numérique existante sur `chunkSize` et `chunkOverlap` reste applicable.

### Configuration RAG

Les endpoints qui lisent ou écrivent la configuration RAG doivent intégrer `chunkMode` afin que le paramètre soit :

- configurable globalement ;
- visible par le frontend ;
- réutilisable comme valeur par défaut lors d'une indexation.

## Impact sur les scripts du répertoire `tools`

Le répertoire `tools` fait partie du périmètre fonctionnel car il contient au moins un script qui pilote déjà l'indexation avec des paramètres de chunking.

### `tools/bulk-import-content.mjs`

Ce script supporte déjà :

- `--chunk-size`
- `--chunk-overlap`

La fonctionnalité doit donc l'étendre avec :

- `--chunk-mode characters|words|tokens`

Règles attendues :

- si `--chunk-mode` est absent, le script doit reprendre la valeur du backend si elle existe ;
- si le backend ne fournit pas encore cette valeur, le fallback doit rester `characters` ;
- si `--chunk-mode` est fourni, la valeur doit être validée côté CLI avant envoi ;
- le log de résolution de configuration doit afficher le mode retenu en plus de `chunkSize` et `chunkOverlap` ;
- le payload envoyé au backend lors de l'import doit inclure `chunkMode`.

La logique actuelle de validation `chunkOverlap < chunkSize` reste inchangée et doit s'appliquer quelle que soit l'unité choisie.

### `tools/generate-demo-content.mjs`

Ce script génère du contenu textuel de démonstration et n'a pas, à ce stade, besoin d'évolution fonctionnelle pour supporter le chunking par mots ou par tokens.

En revanche, il doit rester compatible avec d'éventuels scénarios de test ou de démonstration où les contenus produits sont ensuite importés avec `bulk-import-content.mjs` en mode `words` ou `tokens`.

## Évolution UI

### Écran Documents

L'écran d'indexation des documents doit afficher un nouveau contrôle de sélection du mode :

- `Caractères`
- `Mots`
- `Tokens`

Le formulaire doit ensuite adapter ses libellés dynamiquement :

- `Taille de chunk (caractères)` devient `Taille de chunk (mots)` ou `Taille de chunk (tokens)` selon le mode ;
- `Overlap (caractères)` suit la même logique ;
- le texte du stride doit refléter l'unité active.

Exemples de libellés :

- `Stride calculé pour cette indexation : 80 mots (120 - 40)`
- `Stride calculé pour cette indexation : 260 tokens (300 - 40)`

### Lisibilité pédagogique

Comme cette application est une démo, l'interface doit rendre visible la différence entre les modes.

Le minimum attendu est :

- l'unité active dans les libellés ;
- la valeur du stride dans la même unité ;
- un court texte d'aide précisant que le mode `tokens` s'appuie sur `tiktoken`.

## Contraintes d'implémentation

### 1. Compatibilité ascendante

La modification ne doit pas casser :

- les données JSON existantes ;
- les écrans qui consomment `ragConfig` ;
- les indexations qui ne transmettent pas encore `chunkMode`.

### 2. Unification de la logique

Il faut éviter trois implémentations divergentes disséminées dans le code.

Le découpage doit passer par une abstraction unique, par exemple :

- résolution d'une configuration de chunking normalisée ;
- fonction unique de calcul du stride ;
- fonction unique de chunking qui délègue selon le mode.

### 3. Gestion mémoire et performances

Le mode `tokens` ne doit pas ré-instancier inutilement l'encodeur à chaque micro-opération.

Le comportement attendu est :

- création maîtrisée de l'encodeur ;
- libération correcte si la librairie l'exige ;
- aucune régression notable sur des documents texte de taille raisonnable pour la démo.

### 4. Déterminisme

À entrée identique et configuration identique, le nombre de chunks et leur contenu doivent rester stables.

## Validation métier

Les cas suivants doivent être couverts :

- `chunkSize <= 0` : rejet ou normalisation défensive selon la convention déjà retenue dans le projet ;
- `chunkOverlap < 0` : rejet ou normalisation défensive cohérente avec l'existant ;
- `chunkOverlap >= chunkSize` : rejet explicite ;
- `chunkMode` inconnu : rejet explicite ;
- texte vide ou réduit à des espaces : zéro chunk ;
- document plus petit que la taille demandée : un chunk unique si le contenu n'est pas vide.

## Cas de test attendus

### Tests unitaires backend

Prévoir au minimum :

- un test de compatibilité sur le mode `characters` ;
- un test de découpage `words` sans overlap ;
- un test de découpage `words` avec overlap ;
- un test de découpage `tokens` avec `js-tiktoken` ;
- un test sur la règle `overlap < size` ;
- un test sur la valeur par défaut `chunkMode = characters` ;
- un test sur document vide.

### Tests d'intégration UI/API

Prévoir au minimum :

- affichage correct du sélecteur de mode ;
- adaptation des libellés à l'unité active ;
- envoi de `chunkMode` lors de l'upload ;
- affichage correct du stride calculé selon le mode ;
- persistance et relecture de la valeur par défaut backend.

### Tests CLI

Prévoir au minimum :

- exécution de `bulk-import-content.mjs` sans `--chunk-mode` avec fallback backend ;
- exécution avec `--chunk-mode words` ;
- exécution avec `--chunk-mode tokens` ;
- rejet d'une valeur CLI invalide ;
- affichage du mode final retenu dans les logs.

## Critères d'acceptation

La fonctionnalité sera considérée comme terminée si :

1. l'utilisateur peut choisir `characters`, `words` ou `tokens` dans l'UI ;
2. l'API accepte et valide `chunkMode` ;
3. le backend découpe effectivement selon l'unité choisie ;
4. le mode `tokens` utilise `js-tiktoken` ;
5. le mode historique par caractères continue à fonctionner sans changement de comportement notable ;
6. le stride affiché et calculé reste cohérent dans chaque unité ;
7. les anciennes configurations sans `chunkMode` restent compatibles.
8. le script d'import du répertoire `tools` sait transmettre `chunkMode` de façon cohérente.

## Hors périmètre pour cette itération

Les points suivants peuvent être exclus de la première livraison si nécessaire :

- stratégie avancée de découpage sémantique par phrase ou paragraphe ;
- visualisation détaillée chunk par chunk dans l'UI ;
- choix dynamique de l'encoding tiktoken selon chaque modèle configuré à l'exécution ;
- migration complète de l'historique documentaire pour stocker rétroactivement le mode de chunking.

## Proposition d'ordre d'implémentation

1. Étendre les types backend/frontend avec `chunkMode`.
2. Étendre la persistance de la configuration RAG.
3. Refactoriser la logique de chunking backend autour d'une fonction unifiée par mode.
4. Ajouter le mode `words`.
5. Ajouter le mode `tokens` avec `js-tiktoken`.
6. Brancher l'UI Documents sur le nouveau sélecteur et les libellés dynamiques.
7. Ajouter les tests de validation et de non-régression.
