---
name: refactor-fullstack
description: "À utiliser quand il faut refactorer le full-stack de cette démo RAG, découper de gros fichiers, améliorer la lisibilité, extraire des responsabilités, imposer des fichiers de code de 200 lignes maximum, ou créer de nouveaux fichiers aux noms explicites et parlants pour l’IA."
version: 1.0.0
---

# Refactoring Full-Stack

Skill de refactoring pour le frontend et le backend de cette démo RAG.

Il sert à restructurer le code sans changer inutilement le comportement métier, en privilégiant un découpage clair, des responsabilités étroites, des noms de fichiers explicites et des validations locales rapides.

Ce skill s’applique autant au frontend qu’au backend.

- Frontend : composants React, hooks, pages, logique de formulaire, logique de chargement, mapping de données UI.
- Backend : routes API, services, accès aux données, validation, transformation, orchestration métier.

## Utiliser Ce Skill Quand

- Un fichier est devenu trop long, confus ou mélange plusieurs responsabilités.
- L’utilisateur demande un refactoring frontend ou backend.
- Une page React contient à la fois rendu, appels réseau, transformation de données et logique d’état.
- Une route backend contient à la fois validation, accès aux données, règles métier et sérialisation de réponse.
- Le code fonctionne mais devient difficile à lire, tester ou modifier.
- Il faut extraire des sous-composants, hooks, services, helpers métier ou adaptateurs.
- Il faut créer de nouveaux fichiers de support avec des noms compréhensibles par un humain et par une IA.

## Objectif

Produire un code plus facile à lire, à modifier et à vérifier localement, avec un découpage cohérent entre UI, orchestration et logique métier.

Le skill doit chercher la cause structurelle de la complexité, pas seulement déplacer des lignes arbitrairement.

## Règle Projet Obligatoire

Tout fichier de code créé ou refactoré dans le cadre de ce skill doit viser un maximum de 200 lignes.

Règle d’application :

- cible normale : 80 à 160 lignes ;
- plafond ferme : 200 lignes pour les fichiers de code refactorés ou nouvellement créés ;
- si un fichier menace de dépasser 200 lignes, il faut le découper avant de continuer ;
- ne pas contourner la règle en déplaçant du bruit vers un fichier `utils.ts`, `helpers.ts` ou `misc.ts` sans responsabilité claire.

Exceptions tolérées seulement si elles sont réellement difficiles à éviter :

- fichiers de types massifs ou schémas très mécaniques ;
- fichiers générés automatiquement ;
- tables de constantes volumineuses qui restent plus lisibles groupées.

Même dans ces cas, il faut d’abord vérifier si un découpage plus clair est possible.

## Convention De Nommage Pour L’IA

Quand de nouveaux fichiers sont créés, leurs noms doivent décrire précisément leur rôle.

Préférer :

- `buildRagAnswerPayload.ts`
- `normalizeDocumentFormValues.ts`
- `createSessionCookie.ts`
- `useGroupSelection.ts`
- `loadDocumentsIndex.ts`
- `mapUserRecordToResponse.ts`

Éviter sauf cas évident et très local :

- `utils.ts`
- `helpers.ts`
- `common.ts`
- `shared.ts`
- `misc.ts`
- `index.ts` comme zone fourre-tout

Principe : un nom de fichier doit permettre à une IA de deviner ce que fait le fichier sans devoir l’ouvrir.

## Heuristiques De Découpage

### Frontend

Découper en séparant autant que possible :

- la page ou le composant conteneur ;
- les sous-composants d’affichage ;
- les hooks de logique d’état ou d’effets ;
- les fonctions de transformation de données UI ;
- les constantes ou configurations d’affichage.

Exemples de découpage utile :

- extraire `useQuestionSubmission.ts` d’une page qui gère à la fois formulaire et requête ;
- extraire `QuestionResultPanel.tsx` d’un composant qui rend plusieurs zones distinctes ;
- extraire `mapApiDocumentToCardModel.ts` si le mapping encombre le JSX ;
- extraire `DocumentFiltersBar.tsx` si la barre de filtres devient une responsabilité autonome.

### Backend

Découper en séparant autant que possible :

- la définition de route ;
- la validation d’entrée ;
- l’orchestration métier ;
- l’accès aux fichiers ou aux données ;
- le mapping vers la réponse API.

Exemples de découpage utile :

- extraire `validateRagQuestionInput.ts` d’une route volumineuse ;
- extraire `saveDocumentRecord.ts` d’un handler qui écrit en base ou en fichier ;
- extraire `buildGroupResponse.ts` si la sérialisation devient verbeuse ;
- extraire `deleteSessionById.ts` si la suppression porte des règles propres.

## Règles De Refactoring

1. Commencer par l’ancre locale la plus concrète : fichier trop long, composant confus, handler surchargé, test cassé.
2. Identifier la responsabilité dominante du fichier.
3. Repérer les blocs qui relèvent d’une autre responsabilité.
4. Extraire ces blocs vers un fichier dédié au nom explicite.
5. Garder le comportement identique sauf demande contraire explicite.
6. Vérifier immédiatement après la première extraction avec le test, le typecheck ou la validation la plus locale disponible.
7. Répéter par petites itérations plutôt que faire une réécriture massive d’un seul coup.

## Ce Que Le Skill Doit Favoriser

- des fonctions courtes et orientées action ;
- des composants React plus lisibles que le JSX monolithique ;
- des modules backend qui exposent une responsabilité unique ;
- des noms de fichiers, fonctions et variables descriptifs ;
- des dépendances injectées ou passées explicitement quand cela clarifie le flux ;
- des validations locales rapides après chaque changement substantiel.

## Ce Que Le Skill Doit Éviter

- déplacer du code sans clarifier les responsabilités ;
- introduire une architecture abstraite ou générique sans besoin concret ;
- multiplier les couches inutiles ;
- créer des fichiers vagues servant de dépotoir technique ;
- mélanger UI, accès réseau et transformation métier dans un même module ;
- mélanger route HTTP, persistance et règles métier dans un même gros handler ;
- lancer un refactoring large sans validation intermédiaire.

## Organisation Recommandée

Le skill doit privilégier un regroupement par responsabilité réelle plutôt que par catégorie générique.

Préférer par exemple :

- un fichier de composant principal et ses sous-parties directement nommées ;
- un fichier de route et les fichiers métier immédiatement associés ;
- un fichier de mapping ou de validation nommé selon le cas d’usage concret.

Éviter par défaut :

- les dossiers `utils/` remplis de fonctions sans cohérence métier ;
- les dossiers `components/` avec des noms trop abstraits si la proximité fonctionnelle est plus claire ;
- les extractions qui éloignent le code sans gain de compréhension.

## Stratégie De Sortie Attendue

Quand ce skill est utilisé pour exécuter un refactoring, il doit :

1. identifier le fichier ou la zone cible ;
2. formuler en une phrase la raison structurelle du refactoring ;
3. effectuer de petites extractions cohérentes ;
4. créer si nécessaire des fichiers supplémentaires aux noms explicites ;
5. vérifier localement le résultat.

## Format De Réponse Recommandé

Le skill doit répondre de manière opérationnelle et concise, en explicitant :

- la responsabilité qui reste dans le fichier principal ;
- ce qui a été extrait ;
- pourquoi le nouveau découpage est plus clair ;
- quelle validation a été exécutée.

## Checklist Minimale

Avant de considérer le refactoring terminé, vérifier :

1. les fichiers touchés respectent-ils la limite de 200 lignes, ou une exception est-elle justifiée ?
2. chaque nouveau fichier a-t-il un nom spécifique, compréhensible et non générique ?
3. le comportement visible ou métier a-t-il été préservé ?
4. le code est-il plus simple à relire qu’avant ?
5. une validation locale a-t-elle été exécutée après les changements ?

## Limite D’Intervention

Ce skill sert à refactorer, clarifier et découper.

- Il ne doit pas profiter du refactoring pour changer arbitrairement le produit.
- Il peut corriger au passage une incohérence locale évidente si elle bloque le refactoring.
- Il ne doit pas élargir le périmètre sans nécessité technique démontrable.
- Il doit toujours préférer le plus petit changement structurel suffisant.