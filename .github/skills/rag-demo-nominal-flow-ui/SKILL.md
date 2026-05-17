---
name: rag-demo-nominal-flow-ui
description: "À utiliser systématiquement dès qu’un travail touche à un écran frontend de cette démo RAG, pour définir ou vérifier le processus nominal, mettre l’action principale au premier plan, et reléguer les flux secondaires ou tertiaires sans polluer l’écran principal."
version: 1.0.0
---

# Processus Nominal D'Abord

Skill de cadrage UX/UI pour la démo RAG, centré sur la hiérarchie d'usage, la primauté de la tâche principale et l'intégration discrète des fonctions secondaires.

Dans ce projet, ce skill doit etre considere comme systematique des qu'un travail touche a un ecran frontend, a une page, a un flux ou a une zone d'action visible.

Il faut le traiter comme une convention projet obligatoire, pas comme un simple aide-memoire de design.

Ce skill complète [rag-demo-ui-ux-review](../rag-demo-ui-ux-review/SKILL.md).

- `rag-demo-ui-ux-review` sert à auditer un écran ou un flux.
- `rag-demo-nominal-flow-ui` sert à décider ou corriger la structure d'un écran quand le problème principal est le mauvais choix du processus nominal.

Ce skill doit idealement etre utilise des la conception initiale d'un ecran, avant meme le premier maquettage detaille ou la premiere implementation frontend.

Son role n'est pas seulement de corriger une hiérarchie deja ratee, mais d'eviter de la rater des le depart.

Dans cette base, il ne doit pas etre reserve aux cas ou quelqu'un formule explicitement la question du processus nominal. Il doit servir par defaut sur tout travail d'ecran.

## Obligation D'Usage

Dans cette démo RAG, toute intervention sur un ecran frontend doit passer par ce skill.

Cela inclut :

- la conception initiale ;
- la refonte ;
- l'ajout d'un bloc ;
- le deplacement d'un CTA ;
- l'ajout d'un panneau secondaire ;
- la revision d'un formulaire ;
- le traitement d'une demande qui semble n'etre que visuelle ou textuelle.

Exception :

- seules les corrections purement cosmetiques, sans effet sur la hiérarchie, le guidage, les actions, l'ordre de lecture ou le processus, peuvent se passer de ce skill.

Par defaut, en cas de doute, il faut utiliser ce skill.

## Utiliser Ce Skill Quand

- Toute modification touche un ecran frontend, meme si la demande semble d'abord purement fonctionnelle ou visuelle.
- Un nouvel ecran, une nouvelle page ou un nouveau flux est en cours de conception.
- Il faut decider la structure initiale d'une page avant de choisir les composants ou le styling detaille.
- L'utilisateur demande : "quel est le process nominal ?"
- Un écran semble demander trop de choix avant de commencer la tâche réelle.
- Une page mélange plusieurs logiques : production, configuration, benchmark, aide, administration.
- L'interface met trop en avant des mécanismes internes au lieu de l'action utilisateur.
- Il faut décider ce qui est primaire, secondaire et tertiaire sur un écran.
- Il faut concevoir une hiérarchie de CTA cohérente.
- Il faut refondre un écran sans d'abord faire un audit large du site entier.

## Moment D'Intervention Recommande

Ordre recommande pour un nouvel ecran :

1. utiliser ce skill pour definir le processus nominal ;
2. seulement ensuite definir les blocs d'ecran et les CTA ;
3. ensuite seulement travailler la densite, les composants et le style ;
4. utiliser `rag-demo-ui-ux-review` plus tard pour auditer le resultat reel.

Autrement dit, ce skill doit servir en amont. L'audit vient apres.

Pour ce projet, il doit aussi servir pendant toute evolution d'ecran existant, meme mineure, afin d'eviter les regressions de hiérarchie et de processus.

Si cette etape n'a pas ete faite, la conception de l'ecran n'est pas consideree comme suffisamment cadree.

## Regle D'Usage Projet

Dans cette démo RAG, tout travail portant sur un ecran frontend doit commencer par une verification rapide avec ce skill, meme si la demande initiale parle seulement de :

- texte ;
- CTA ;
- formulaire ;
- benchmark ;
- navigation locale ;
- suggestions ;
- disposition des cartes ;
- ajout d'un panneau ou d'un bloc secondaire.

Question de controle minimale a appliquer systematiquement :

1. quel est le processus nominal de cet ecran ?
2. l'action principale est-elle visible immediatement ?
3. ce changement renforce-t-il le nominal ou ajoute-t-il du bruit secondaire ?

Si cette verification n'a pas ete faite, la conception de l'ecran doit etre consideree comme incomplete.

## Question Centrale

Pour chaque écran, commencer par répondre à cette question :

> Si l'utilisateur clique sur cette entrée de navigation, quelle action pense-t-il pouvoir accomplir immédiatement ?

La structure de la page doit d'abord servir cette réponse.

## Principe Cardinal

Un écran ne doit pas commencer par interroger l'utilisateur sur sa méthode de travail si une tâche nominale évidente existe déjà.

Conséquence directe :

- l'interface doit privilégier un processus nominal ;
- les variantes avancées doivent venir après ;
- les fonctions secondaires ne doivent jamais reconfigurer la lecture initiale de la page.

## Méthode

1. Identifier la promesse implicite portée par le libellé de navigation.
2. Formuler la tâche principale en un verbe d'action simple.
3. Définir le processus nominal en 3 à 5 étapes maximum.
4. Lister les fonctions secondaires et tertiaires.
5. Vérifier que le premier écran visible permet d'entrer directement dans le processus nominal.
6. Reléguer les fonctions secondaires dans des points d'accès discrets : aide au démarrage, suggestions, accordéon, panneau latéral, détail replié.
7. Vérifier que le CTA principal ressemble à une action finale, pas à un contrôle local.

## Règles Structurelles

### 1. Le primaire doit apparaître immédiatement

En arrivant sur la page, l'utilisateur doit voir :

- la tâche principale ;
- l'entrée de saisie ou le contrôle principal ;
- le CTA principal.

Ce trio doit être perceptible avant tout mécanisme secondaire.

### 2. Les suggestions doivent aider, pas concurrencer

Les questions suggérées, scénarios de démarrage ou exemples doivent :

- apparaître après le contrôle principal ;
- accélérer l'entrée dans la tâche ;
- éviter de créer un second flux concurrent.

Bon exemple : des raccourcis qui remplissent ou lancent directement la tâche principale.

Mauvais exemple : une galerie de cartes avec plusieurs CTA locaux qui rivalisent avec le CTA principal.

### 3. Les flux secondaires doivent être discrets

Benchmark, inspection, paramètres avancés, audit, comparaison, scoring :

- ne doivent pas être en tête de page ;
- ne doivent pas définir la mise en page initiale ;
- doivent être accessibles, mais comme des extensions du flux principal.

Patrons autorisés :

- accordéon ;
- panneau replié ;
- section "Voir plus" ;
- panneau latéral ;
- instrumentation après action.

### 4. Ne pas demander un choix de mode trop tôt

Si une tâche nominale évidente existe, ne pas commencer par :

- choisir un mode ;
- choisir un type de parcours ;
- choisir un lot ;
- choisir une variante technique.

Ces choix ne sont acceptables en première étape que s'ils sont indispensables à l'accomplissement même de la tâche.

### 5. Le benchmark est presque toujours secondaire

Dans cette démo, l'évaluation, le benchmark et les cas de référence sont utiles mais ne constituent généralement pas la promesse principale de l'écran utilisateur.

Exemple :

- sur `Question RAG`, le nominal est de poser une question ;
- le benchmark vient ensuite comme outil d'analyse ou de démonstration experte.

## Hiérarchie Attendue Des Écrans

Pour un écran bien construit, la hiérarchie doit se lire comme suit :

1. ce que je peux faire ici ;
2. comment je commence tout de suite ;
3. ce que je peux utiliser pour aller plus vite ;
4. ce que je peux inspecter ou évaluer en plus.

Si l'écran se lit dans l'ordre inverse, la hiérarchie est probablement fausse.

## Signaux D'Alerte

Le skill doit considérer qu'un écran est mal structuré si l'un de ces signes apparaît :

- plusieurs CTA de même poids apparaissent avant la tâche principale ;
- l'utilisateur doit comprendre une taxonomie interne avant de pouvoir agir ;
- les cartes, filtres ou lots dominent visuellement la saisie principale ;
- la page ressemble à une console de pilotage alors que la navigation annonce une action simple ;
- la partie benchmark ou analyse est visible avant toute exécution ;
- la page demande "comment voulez-vous travailler ?" au lieu de permettre d'agir.

## Sorties Attendues

Quand ce skill est invoqué, il doit produire une réponse courte et opérationnelle, orientée décision UX ou refonte structurelle.

Selon la demande, il peut produire :

- un diagnostic de hiérarchie ;
- la définition du processus nominal ;
- un wireframe textuel bloc par bloc ;
- une règle de placement des CTA ;
- une stratégie pour déplacer le secondaire vers un panneau discret ;
- une proposition de refonte frontend sans entrer immédiatement dans le styling détaillé.

## Format Recommandé

Répondre en priorité avec :

1. le processus nominal ;
2. ce qui est secondaire ;
3. la structure de page recommandée ;
4. les éléments à retirer du premier niveau ;
5. les éléments à conserver en accès discret.

## Application Spécifique Au Projet

Pour cette démo RAG :

- thème clair par défaut ;
- ton sérieux, rigoureux, B2B ;
- le contrôle d'accès doit être intelligible, mais ne doit pas casser la simplicité de la tâche ;
- une entrée de navigation comme `Question RAG` doit d'abord conduire à une question et à une réponse ;
- les éléments de benchmark doivent être disponibles sans devenir la structure principale de la page.

## Limites

Ce skill sert à décider la bonne structure d'écran et la hiérarchie des usages.

- Il peut guider une implémentation frontend.
- Il doit servir avant implementation, puis rester actif pendant toute evolution d'ecran.
- Il ne remplace pas un audit UX complet à l'échelle du site.
- Si la demande devient une critique large de l'interface entière, utiliser plutôt `rag-demo-ui-ux-review`.
