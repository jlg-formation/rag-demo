# Processus D’Audit UX

Utiliser cette fiche comme point d’entrée général avant de charger un critère particulier.

## Livrable

Le livrable attendu est un fichier d’audit dans `/UX-AUDIT/<slug-page>.md` à la racine du dépôt.

Ce fichier doit servir de document de décision pour les prochaines corrections UI/UX sur la page ou la zone auditée.

## Finalité

Un audit UX ne consiste pas seulement à juger si une interface est belle ou non. Il sert à vérifier qu’un utilisateur puisse comprendre, décider et agir avec un effort raisonnable, dans un cadre cohérent avec son contexte et ses habitudes.

## Démarche Recommandée

1. Identifier la tâche principale de l’écran.
2. Observer si possible l’interface rendue dans un navigateur, en conditions proches d’un usage réel.
3. Décrire ce que l’utilisateur doit comprendre en moins de quelques secondes.
4. Vérifier les critères ergonomiques pertinents.
5. Distinguer problèmes de structure, problèmes de style et problèmes de contenu.
6. Prioriser ce qui bloque la compréhension, puis ce qui dégrade la fluidité, puis ce qui nuit à la finition.
7. Transformer les constats en roadmap de correction ordonnée.

## Observation Directe Du Site

Quand un outil de type navigateur automatisé ou serveur MCP Chrome DevTools est disponible, l’audit doit s’appuyer sur une observation réelle de l’interface.

Points à vérifier de préférence en situation :

- rendu desktop ;
- rendu mobile ;
- comportements responsive ;
- états de focus, survol, chargement et erreur ;
- lisibilité réelle des blocs et des espacements ;
- progression dans un flux utilisateur.

## Repli Sur Lecture Du Code Frontend

Si l’observation directe du site est impossible, il faut prévenir l’utilisateur explicitement.

Le mode de repli consiste alors à :

1. lire les fichiers frontend pertinents ;
2. reconstituer la structure de l’écran à partir du code ;
3. s’appuyer sur les captures éventuelles si elles existent ;
4. signaler dans le rapport que l’audit n’a pas été mené sur un rendu réel.

Dans ce mode, il faut être plus prudent sur :

- les jugements d’espacement fin ;
- la perception réelle des volumes ;
- les effets responsive ;
- les états de focus, hover, chargement et erreur.

## Questions D’Ouverture

- Que doit faire l’utilisateur ici ?
- Quels éléments sont censés guider l’action ?
- Quelle charge de perception, de mémoire, de décision et d’action impose l’écran ?
- Le système donne-t-il du contrôle ou déclenche-t-il des effets surprenants ?
- L’interface est-elle homogène, compréhensible et compatible avec les habitudes des utilisateurs visés ?

## Huit Critères À Balayer

1. Guidage
2. Charge de travail
3. Contrôle explicite
4. Adaptabilité
5. Gestion des erreurs
6. Homogénéité / cohérence
7. Signifiance des codes et dénominations
8. Compatibilité

## Règle De Priorisation

- Corriger d’abord ce qui empêche l’utilisateur de comprendre où il est, ce qu’il peut faire, et quelle action est principale.
- Corriger ensuite ce qui augmente inutilement l’effort mental ou moteur.
- Corriger enfin ce qui nuit à la finition ou à la crédibilité perçue.

## Règle De Non-Implémentation

Pendant l’audit, ne pas chercher à coder.

- Ne pas modifier l’interface.
- Ne pas proposer de patch comme sortie principale.
- Produire une analyse écrite, priorisée et actionnable.
- L’usage d’outils navigateur est autorisé pour observer, capturer et documenter, mais pas pour transformer l’application.
- Si le navigateur n’est pas accessible, le dire clairement et basculer sur l’analyse des fichiers frontend uniquement.
